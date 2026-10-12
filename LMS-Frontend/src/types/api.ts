export interface Book {
  bookId: number;
  title: string;
  author: string;
  isbn: string;
  publicationYear: number;
  publisher: string;
  description: string;
  genre: string;
  copyCount: number;
  availableCopyCount: number;
  bookCopies: BookCopy[];
  isAvailable: boolean;
}

export type CopyStatus = 'Circulating' | 'Maintenance' | 'Lost' | 'Retired';

export interface BookCopy {
  bookCopyId: number;
  bookId: number;
  accessionNumber: string;
  condition: string;
  status: CopyStatus;
  createdAt: string;
  isAvailable: boolean;
}

export type BookInput = Pick<Book, 'title' | 'author' | 'isbn' | 'genre' | 'publisher' | 'publicationYear' | 'description'>;
export type BookCopyInput = Pick<BookCopy, 'accessionNumber' | 'condition' | 'status'>;

export interface BookListResponseDto {
  books: Book[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  searchQuery?: string;
}

export interface BorrowRequestDto {
  studentId: number;
  bookCopyId: number;
  dueDate: string;
}

export interface BorrowRecord {
  borrowRecordId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  bookCopyId: number;
  bookId: number;
  bookTitle: string;
  accessionNumber: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string | null;
}

export interface DashboardMetricsDto {
  totalStudents: number;
  totalBooks: number;
  totalLibrarians: number;
  totalBorrowings: number;
  totalPublications: number;
  totalCopies: number;
  availableCopies: number;
  borrowedCopies: number;
  activeLoans: number;
  returnedLoans: number;
  overdueLoans: number;
  recentActivity: BorrowRecord[];
  genreTitleCounts: Record<string, number>;
}

export interface Student {
  studentId: number;
  studentName: string;
  email: string;
  registrationNumber: string;
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

export interface StaffProfile {
  id: string;
  email: string;
  role: 'Admin' | 'Librarian';
  isDisabled: boolean;
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

export interface ContactMessage extends ContactInquiry {
  id: number;
  submittedAt: string;
}
