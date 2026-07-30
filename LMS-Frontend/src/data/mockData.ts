import { Book, BorrowRecord, Student, Librarian, Publication } from '../types/api';

export const initialBooks: Book[] = [
  {
    bookId: 101,
    title: 'The Alchemist',
    author: 'Paulo Coelho',
    isbn: '978-0062315007',
    publishedDate: '2014-04-15T00:00:00.000Z',
    isAvailable: true,
    genre: 'Fiction',
    copies: 4,
  },
  {
    bookId: 102,
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    publishedDate: '2008-08-11T00:00:00.000Z',
    isAvailable: true,
    genre: 'Technology',
    copies: 2,
  },
  {
    bookId: 103,
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    isbn: '978-0062316097',
    publishedDate: '2015-02-10T00:00:00.000Z',
    isAvailable: false,
    genre: 'History',
    copies: 0,
  },
  {
    bookId: 104,
    title: 'Introduction to Algorithms',
    author: 'Cormen et al.',
    isbn: '978-0262033848',
    publishedDate: '2009-07-31T00:00:00.000Z',
    isAvailable: true,
    genre: 'Computer Science',
    copies: 3,
  },
  {
    bookId: 105,
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    isbn: '978-0201633610',
    publishedDate: '1994-10-21T00:00:00.000Z',
    isAvailable: true,
    genre: 'Technology',
    copies: 5,
  },
  {
    bookId: 106,
    title: 'Atomic Habits',
    author: 'James Clear',
    isbn: '978-0735211292',
    publishedDate: '2018-10-16T00:00:00.000Z',
    isAvailable: true,
    genre: 'Self-Help',
    copies: 6,
  },
];

export const initialBorrowRecords: BorrowRecord[] = [
  {
    borrowRecordId: 1001,
    bookId: 103,
    borrowerName: 'Aditi Sharma',
    borrowerEmail: 'aditi.sharma@university.edu',
    phone: '+1 555-0142',
    borrowDate: '2026-07-10T10:30:00.000Z',
    returnDate: null,
    book: initialBooks[2],
  },
  {
    borrowRecordId: 1002,
    bookId: 101,
    borrowerName: 'Rahul Verma',
    borrowerEmail: 'rahul.v@university.edu',
    phone: '+1 555-0188',
    borrowDate: '2026-06-28T14:15:00.000Z',
    returnDate: '2026-07-05T09:00:00.000Z',
    book: initialBooks[0],
  },
  {
    borrowRecordId: 1003,
    bookId: 102,
    borrowerName: 'Michael Chen',
    borrowerEmail: 'm.chen@university.edu',
    phone: '+1 555-0199',
    borrowDate: '2026-07-20T11:45:00.000Z',
    returnDate: null,
    book: initialBooks[1],
  },
];

export const initialStudents: Student[] = [
  {
    studentId: 201,
    studentName: 'Aditi Sharma',
    email: 'aditi.sharma@university.edu',
    phone: '+1 555-0142',
    gender: 'Female',
    address: '42 Campus Avenue, Hall 4, Room 302',
  },
  {
    studentId: 202,
    studentName: 'Rahul Verma',
    email: 'rahul.v@university.edu',
    phone: '+1 555-0188',
    gender: 'Male',
    address: '18 Science Block, West Campus',
  },
  {
    studentId: 203,
    studentName: 'Sophia Rodriguez',
    email: 's.rodriguez@university.edu',
    phone: '+1 555-0177',
    gender: 'Female',
    address: '88 Oak Street, Apt 4B',
  },
  {
    studentId: 204,
    studentName: 'David Kim',
    email: 'david.kim@university.edu',
    phone: '+1 555-0123',
    gender: 'Male',
    address: '105 Student Village, East Wing',
  },
  {
    studentId: 205,
    studentName: 'Emily Watson',
    email: 'e.watson@university.edu',
    phone: '+1 555-0165',
    gender: 'Female',
    address: '12 Library Drive, Room 110',
  },
];

export const initialLibrarians: Librarian[] = [
  {
    librarianId: 301,
    name: 'Eleanor Vance',
    age: 42,
    phone: '+1 555-0301',
  },
  {
    librarianId: 302,
    name: 'Marcus Brody',
    age: 56,
    phone: '+1 555-0302',
  },
  {
    librarianId: 303,
    name: 'Sarah Jenkins',
    age: 34,
    phone: '+1 555-0303',
  },
];

export const initialPublications: Publication[] = [
  {
    id: 401,
    title: 'The New York Times',
    publisher: 'The New York Times Company',
    publishedDate: '2026-07-28T00:00:00.000Z',
    type: 'Newspaper', // 0
    isAvailable: true,
  },
  {
    id: 402,
    title: 'The Wall Street Journal',
    publisher: 'Dow Jones & Company',
    publishedDate: '2026-07-28T00:00:00.000Z',
    type: 'Newspaper', // 0
    isAvailable: true,
  },
  {
    id: 403,
    title: 'National Geographic',
    publisher: 'National Geographic Society',
    publishedDate: '2026-07-01T00:00:00.000Z',
    type: 'Magazine', // 1
    isAvailable: true,
  },
  {
    id: 404,
    title: 'Scientific American',
    publisher: 'Springer Nature',
    publishedDate: '2026-07-15T00:00:00.000Z',
    type: 'Magazine', // 1
    isAvailable: false,
  },
  {
    id: 405,
    title: 'The Economist',
    publisher: 'The Economist Group',
    publishedDate: '2026-07-24T00:00:00.000Z',
    type: 'Magazine', // 1
    isAvailable: true,
  },
];
