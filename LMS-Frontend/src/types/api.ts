export interface Book {
  bookId: number;
  title: string;
  author: string;
  isbn: string;
  publishedDate: string;
  isAvailable: boolean;
  genre?: string;
  copies?: number;
}

export interface BookListResponseDto {
  books: Book[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  searchQuery?: string;
}

export interface BorrowRequestDto {
  bookId: number;
  borrowerName: string;
  borrowerEmail: string;
  phone: string;
}

export interface BorrowRecord {
  borrowRecordId: number;
  bookId: number;
  borrowerName: string;
  borrowerEmail: string;
  phone: string;
  borrowDate: string;
  returnDate?: string | null;
  book?: Book;
}

export interface DashboardMetricsDto {
  totalStudents: number;
  totalBooks: number;
  totalLibrarians: number;
  totalBorrowings: number;
  totalPublications: number;
}

export interface Student {
  studentId: number;
  studentName: string;
  email: string;
  phone: string;
  gender: string;
  address: string;
}

export interface StudentListResponseDto {
  students: Student[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface Librarian {
  librarianId: number;
  name: string;
  age: number;
  phone: string;
}

export interface LibrarianListResponseDto {
  librarians: Librarian[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export type PublicationType = 0 | 1 | 'Newspaper' | 'Magazine';

export interface Publication {
  id: number;
  title: string;
  publisher: string;
  publishedDate: string;
  type: PublicationType;
  isAvailable: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
  twoFactorRecoveryCode?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AccessTokenResponse {
  tokenType?: string;
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

export interface ContactInquiry {
  name: string;
  email: string;
  subject: string;
  message: string;
}
