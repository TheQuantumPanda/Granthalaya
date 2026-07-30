import {
  Book,
  BookListResponseDto,
  BorrowRecord,
  BorrowRequestDto,
  DashboardMetricsDto,
  Librarian,
  LibrarianListResponseDto,
  LoginRequest,
  AccessTokenResponse,
  Publication,
  Student,
  StudentListResponseDto,
  RegisterRequest,
  ContactInquiry,
} from '../types/api';

const DEFAULT_BASE_URL = 'http://localhost:5199';

class ApiService {
  private baseUrl: string;
  private token: string | null;
  private onStatusChangeCallbacks: Array<(status: { isMock: boolean; url: string }) => void> = [];

  private onUnauthorizedCallback: (() => void) | null = null;

  constructor() {
    this.baseUrl = localStorage.getItem('lms_api_base_url') || DEFAULT_BASE_URL;
    this.token = localStorage.getItem('lms_bearer_token') || localStorage.getItem('token') || null;
  }

  public setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/+$/, '');
    localStorage.setItem('lms_api_base_url', this.baseUrl);
    this.notifyStatusChange();
  }

  public getToken(): string | null {
    return this.token;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('lms_bearer_token', token);
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('lms_bearer_token');
      localStorage.removeItem('token');
      localStorage.removeItem('lms_user_email');
    }
  }

  public setUserEmail(email: string) {
    localStorage.setItem('lms_user_email', email);
  }

  public getUserEmail(): string | null {
    const saved = localStorage.getItem('lms_user_email');
    if (saved) return saved;

    // Try decoding from JWT
    if (this.token) {
      try {
        const parts = this.token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const email =
            payload.email ||
            payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
            payload.unique_name ||
            payload.sub;
          if (email && typeof email === 'string') {
            return email;
          }
        }
      } catch {
        // Invalid JWT string, fallback
      }
    }
    return this.token ? 'Authenticated User' : null;
  }

  public getIsMockMode(): boolean {
    return false;
  }

  public setMockMode(_enabled: boolean) {
    // Mock mode disabled - direct backend connection only
  }

  public onStatusChange(callback: (status: { isMock: boolean; url: string }) => void) {
    this.onStatusChangeCallbacks.push(callback);
    callback({ isMock: false, url: this.baseUrl });
    return () => {
      this.onStatusChangeCallbacks = this.onStatusChangeCallbacks.filter((c) => c !== callback);
    };
  }

  private notifyStatusChange() {
    this.onStatusChangeCallbacks.forEach((cb) =>
      cb({ isMock: false, url: this.baseUrl })
    );
  }

  public async checkApiHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${this.baseUrl}/api/Dashboard`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
    });

    if (res.status === 401) {
      this.setToken(null);
      if (this.onUnauthorizedCallback) {
        this.onUnauthorizedCallback();
      }
      throw new Error('Unauthorized: Session expired or invalid credentials. Please log in again.');
    }

    if (!res.ok) {
      let errMessage = `API error (${res.status}): ${res.statusText}`;
      try {
        const body = await res.json();
        if (body.errors && typeof body.errors === 'object' && Object.keys(body.errors).length > 0) {
          errMessage = Object.entries(body.errors)
            .map(([field, errs]) => {
              const messages = Array.isArray(errs) ? errs.join(', ') : String(errs);
              return `${field}: ${messages}`;
            })
            .join(' | ');
        } else if (body.message) {
          errMessage = body.message;
        } else if (body.detail) {
          errMessage = body.detail;
        } else if (body.title) {
          errMessage = body.title;
        } else if (Array.isArray(body) && body.length > 0 && body[0].description) {
          errMessage = body.map((e: any) => e.description).join('. ');
        }
      } catch {
        // Body not JSON
      }
      throw new Error(errMessage);
    }

    if (res.status === 204) {
      return {} as T;
    }

    const text = await res.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  // --- 1. Dashboard ---
  public async getDashboardMetrics(): Promise<DashboardMetricsDto> {
    return this.request<DashboardMetricsDto>('/api/Dashboard', { method: 'GET' });
  }

  // --- 2. Books ---
  public async getBooks(
    searchQuery: string = '',
    page: number = 1,
    pageSize: number = 5
  ): Promise<BookListResponseDto> {
    const queryParams = new URLSearchParams();
    if (searchQuery) queryParams.set('searchQuery', searchQuery);
    if (page) queryParams.set('page', page.toString());
    if (pageSize) queryParams.set('pageSize', pageSize.toString());

    return this.request<BookListResponseDto>(`/api/Books?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  public async getBookById(id: number): Promise<Book> {
    return this.request<Book>(`/api/Books/${id}`, { method: 'GET' });
  }

  public async addBook(bookData: Partial<Book>): Promise<Book> {
    return this.request<Book>('/api/Books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });
  }

  public async updateBook(id: number, bookData: Partial<Book>): Promise<void> {
    return this.request<void>(`/api/Books/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...bookData, bookId: id }),
    });
  }

  public async deleteBook(id: number): Promise<void> {
    return this.request<void>(`/api/Books/${id}`, {
      method: 'DELETE',
    });
  }

  // --- 3. Borrow & Return Transactions ---
  public async borrowBook(requestData: BorrowRequestDto): Promise<void> {
    return this.request<void>('/api/Borrow', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  public async returnBook(borrowRecordId: number): Promise<void> {
    return this.request<void>(`/api/Borrow/return/${borrowRecordId}`, {
      method: 'POST',
    });
  }

  public async getBorrowRecords(): Promise<BorrowRecord[]> {
    return this.request<BorrowRecord[]>('/api/Borrow/records', { method: 'GET' });
  }

  public async deleteBorrowRecord(borrowRecordId: number): Promise<void> {
    return this.request<void>(`/api/Borrow/${borrowRecordId}`, { method: 'DELETE' });
  }

  // --- 4. Students ---
  public async getStudents(
    searchTerm: string = '',
    page: number = 1,
    pageSize: number = 5
  ): Promise<StudentListResponseDto> {
    const queryParams = new URLSearchParams();
    if (searchTerm) queryParams.set('searchTerm', searchTerm);
    if (page) queryParams.set('page', page.toString());
    if (pageSize) queryParams.set('pageSize', pageSize.toString());

    return this.request<StudentListResponseDto>(`/api/Students?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  public async addStudent(studentData: Partial<Student>): Promise<Student> {
    return this.request<Student>('/api/Students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  }

  public async updateStudent(id: number, studentData: Partial<Student>): Promise<void> {
    return this.request<void>(`/api/Students/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...studentData, studentId: id }),
    });
  }

  public async deleteStudent(id: number): Promise<void> {
    return this.request<void>(`/api/Students/${id}`, {
      method: 'DELETE',
    });
  }

  // --- 5. Librarians ---
  public async getLibrarians(
    searchTerm: string = '',
    page: number = 1,
    pageSize: number = 5
  ): Promise<LibrarianListResponseDto> {
    const queryParams = new URLSearchParams();
    if (searchTerm) queryParams.set('searchTerm', searchTerm);
    if (page) queryParams.set('page', page.toString());
    if (pageSize) queryParams.set('pageSize', pageSize.toString());

    return this.request<LibrarianListResponseDto>(`/api/Librarians?${queryParams.toString()}`, {
      method: 'GET',
    });
  }

  public async addLibrarian(librarianData: Partial<Librarian>): Promise<Librarian> {
    return this.request<Librarian>('/api/Librarians', {
      method: 'POST',
      body: JSON.stringify(librarianData),
    });
  }

  public async updateLibrarian(id: number, librarianData: Partial<Librarian>): Promise<void> {
    return this.request<void>(`/api/Librarians/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...librarianData, librarianId: id }),
    });
  }

  public async deleteLibrarian(id: number): Promise<void> {
    return this.request<void>(`/api/Librarians/${id}`, {
      method: 'DELETE',
    });
  }

  // --- 6. Publications ---
  public async getPublications(
    type?: string,
    searchTerm: string = '',
    page: number = 1,
    pageSize: number = 5
  ): Promise<{ publications: Publication[]; totalPages: number; currentPage: number; totalItems: number }> {
    const queryParams = new URLSearchParams();
    if (type) queryParams.set('type', type);
    if (searchTerm) queryParams.set('searchTerm', searchTerm);
    if (page) queryParams.set('page', page.toString());
    if (pageSize) queryParams.set('pageSize', pageSize.toString());

    return this.request<{
      publications: Publication[];
      totalPages: number;
      currentPage: number;
      totalItems: number;
    }>(`/api/Publications?${queryParams.toString()}`, { method: 'GET' });
  }

  public async addPublication(pubData: Partial<Publication>): Promise<Publication> {
    return this.request<Publication>('/api/Publications', {
      method: 'POST',
      body: JSON.stringify(pubData),
    });
  }

  public async updatePublication(id: number, pubData: Partial<Publication>): Promise<void> {
    return this.request<void>(`/api/Publications/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...pubData, id }),
    });
  }

  public async deletePublication(id: number): Promise<void> {
    return this.request<void>(`/api/Publications/${id}`, {
      method: 'DELETE',
    });
  }

  // --- 7. Auth ---
  public async login(loginData: LoginRequest): Promise<AccessTokenResponse> {
    let resRaw: any;
    try {
      resRaw = await this.request<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginData),
      });
    } catch (err: any) {
      if (err.message?.includes('404')) {
        resRaw = await this.request<any>('/login', {
          method: 'POST',
          body: JSON.stringify(loginData),
        });
      } else {
        throw err;
      }
    }

    const token =
      resRaw?.accessToken ||
      resRaw?.token ||
      resRaw?.bearerToken ||
      resRaw?.access_token ||
      resRaw?.data?.accessToken ||
      resRaw?.data?.token;

    if (token) {
      this.setToken(token);
      this.setUserEmail(loginData.email);
    }
    return { accessToken: token || '', expiresIn: resRaw?.expiresIn };
  }

  public async register(regData: RegisterRequest): Promise<void> {
    try {
      await this.request<void>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(regData),
      });
    } catch (err: any) {
      if (err.message?.includes('404')) {
        await this.request<void>('/register', {
          method: 'POST',
          body: JSON.stringify(regData),
        });
      } else {
        throw err;
      }
    }
    this.setUserEmail(regData.email);
  }

  // --- 8. Contact Inquiry ---
  public async sendContactInquiry(data: ContactInquiry): Promise<void> {
    try {
      await this.request<void>('/api/contact', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err: any) {
      if (err.message?.includes('404')) {
        await this.request<void>('/contact', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } else {
        throw err;
      }
    }
  }
}

export const api = new ApiService();
