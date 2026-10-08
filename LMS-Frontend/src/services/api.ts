import {
  Book,
  BookInput,
  BookCopy,
  BookCopyInput,
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
  ContactInquiry,
  StaffProfile,
} from '../types/api';

const DEFAULT_BASE_URL = 'http://localhost:5199';

class ApiService {
  private baseUrl: string;
  private token: string | null;
  private onStatusChangeCallbacks: Array<(status: { isMock: boolean; url: string }) => void> = [];

  private onUnauthorizedCallback: (() => void) | null = null;

  constructor() {
    this.baseUrl = localStorage.getItem('lms_api_base_url') || DEFAULT_BASE_URL;
    localStorage.removeItem('lms_bearer_token');
    localStorage.removeItem('token');
    this.token = sessionStorage.getItem('lms_bearer_token');
  }

  public setOnUnauthorized(callback: () => void) {
    this.onUnauthorizedCallback = callback;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    const nextUrl = url.replace(/\/+$/, '');
    if (nextUrl !== this.baseUrl && this.token) {
      this.setToken(null);
      this.onUnauthorizedCallback?.();
    }
    this.baseUrl = nextUrl;
    localStorage.setItem('lms_api_base_url', this.baseUrl);
    this.notifyStatusChange();
  }

  public getToken(): string | null {
    return this.token;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) sessionStorage.setItem('lms_bearer_token', token);
    else sessionStorage.removeItem('lms_bearer_token');
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
      if (endpoint !== '/api/auth/login') {
        this.setToken(null);
        this.onUnauthorizedCallback?.();
      }
      throw new Error(endpoint === '/api/auth/login'
        ? 'Invalid email or password, or account unavailable.'
        : 'Session expired or invalid. Please sign in again.');
    }

    if (res.status === 403) throw new Error('You do not have permission for this operation.');

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

  public async addBook(bookData: BookInput): Promise<Book> {
    return this.request<Book>('/api/Books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });
  }

  public async updateBook(id: number, bookData: BookInput): Promise<void> {
    return this.request<void>(`/api/Books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    });
  }

  public async deleteBook(id: number): Promise<void> {
    return this.request<void>(`/api/Books/${id}`, {
      method: 'DELETE',
    });
  }

  public async addBookCopy(bookId: number, data: BookCopyInput): Promise<BookCopy> {
    return this.request<BookCopy>(`/api/Books/${bookId}/copies`, { method: 'POST', body: JSON.stringify(data) });
  }

  public async updateBookCopy(bookId: number, copyId: number, data: BookCopyInput): Promise<BookCopy> {
    return this.request<BookCopy>(`/api/Books/${bookId}/copies/${copyId}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  public async deleteBookCopy(bookId: number, copyId: number): Promise<void> {
    return this.request<void>(`/api/Books/${bookId}/copies/${copyId}`, { method: 'DELETE' });
  }

  public async getAllBooks(): Promise<Book[]> {
    const first = await this.getBooks('', 1, 100);
    const books = [...first.books];
    for (let page = 2; page <= first.totalPages; page++)
      books.push(...(await this.getBooks('', page, 100)).books);
    return books;
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

  public async getAllStudents(): Promise<Student[]> {
    const first = await this.getStudents('', 1, 100);
    const students = [...first.students];
    for (let page = 2; page <= first.totalPages; page++)
      students.push(...(await this.getStudents('', page, 100)).students);
    return students;
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
  public async login(loginData: LoginRequest): Promise<StaffProfile> {
    const token = await this.request<AccessTokenResponse>('/api/auth/login', {
      method: 'POST', body: JSON.stringify(loginData),
    });
    if (!token.accessToken) throw new Error('No access token returned.');
    this.setToken(token.accessToken);
    try { return await this.getProfile(); }
    catch (error) { this.setToken(null); throw error; }
  }

  public getProfile(): Promise<StaffProfile> {
    return this.request<StaffProfile>('/api/auth/me');
  }

  public async logout(): Promise<void> {
    try { if (this.token) await this.request<void>('/api/auth/logout', { method: 'POST' }); }
    finally { this.setToken(null); }
  }

  public changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return this.request<void>('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
  }

  public getStaff(): Promise<StaffProfile[]> { return this.request<StaffProfile[]>('/api/staff'); }
  public createLibrarianAccount(email: string, password: string): Promise<StaffProfile> {
    return this.request<StaffProfile>('/api/staff', { method: 'POST', body: JSON.stringify({ email, password }) });
  }
  public changeStaffRole(id: string, role: 'Admin' | 'Librarian'): Promise<StaffProfile> {
    return this.request<StaffProfile>(`/api/staff/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) });
  }
  public enableStaff(id: string): Promise<void> {
    return this.request<void>(`/api/staff/${id}/enable`, { method: 'POST' });
  }
  public disableStaff(id: string): Promise<void> {
    return this.request<void>(`/api/staff/${id}/disable`, { method: 'POST' });
  }

  // --- 8. Contact Inquiry ---
  public async sendContactInquiry(data: ContactInquiry): Promise<void> {
    await this.request<void>('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiService();
