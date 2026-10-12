import { StatusBadge } from '../StatusBadge';
import { useDialog } from '../useDialog';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Plus,
  CheckCircle2,
  BookOpen,
  X,
  RefreshCw,
  Search,
} from 'lucide-react';
import { api } from '../../services/api';
import { Book, BorrowRecord, Student } from '../../types/api';
import { Pagination } from '../Pagination';
import { ConfirmModal } from '../ConfirmModal';
import { dueDateUtc, isOverdue, localDate, localDateInput } from '../../services/dates';

interface BorrowRecordsViewProps {
  onAddToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  preSelectedBookForBorrow?: Book | null;
  onClearPreSelectedBook?: () => void;
  onRequestAuth?: (promptMessage?: string) => void;
}

export const BorrowRecordsView: React.FC<BorrowRecordsViewProps> = ({
  onAddToast,
  preSelectedBookForBorrow,
  onClearPreSelectedBook,
  onRequestAuth,
}) => {
  const checkAuth = () => {
    if (!api.getToken()) {
      if (onRequestAuth) {
        onRequestAuth('Please log in to complete this action.');
      } else {
        onAddToast('info', 'Authentication Required', 'Please log in to complete this action.');
      }
      return false;
    }
    return true;
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const recordsRequestId = useRef(0);
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'borrowed' | 'returned' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [bookSearchLoading, setBookSearchLoading] = useState(false);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [bookSearchError, setBookSearchError] = useState('');
  const [studentSearchError, setStudentSearchError] = useState('');
  const bookSearchId = useRef(0);
  const studentSearchId = useRef(0);

  // New Loan Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | ''>('');
  const [selectedCopyId, setSelectedCopyId] = useState<number | ''>('');
  const [selectedStudentId, setSelectedStudentId] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState(localDateInput(new Date(Date.now() + 14 * 86400000)));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Return confirmation
  const [returningRecordId, setReturningRecordId] = useState<number | null>(null);

  const fetchRecords = async () => {
    const requestId = ++recordsRequestId.current;
    setIsLoading(true);
    setLoadError('');
    try {
      const result = await api.getBorrowRecords(searchQuery, filterStatus === 'borrowed' ? 'active' : filterStatus, currentPage);
      if (requestId !== recordsRequestId.current) return;
      if (currentPage > Math.max(1, result.totalPages)) { setCurrentPage(Math.max(1, result.totalPages)); return; }
      setRecords(result.records); setTotalPages(result.totalPages); setTotalItems(result.totalItems);
    } catch (err: any) {
      if (requestId !== recordsRequestId.current) return;
      setLoadError(err.message);
      setRecords([]);
      onAddToast('error', 'Error Loading Borrow Records', err.message);
    } finally {
      if (requestId === recordsRequestId.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { void fetchRecords(); }, 250);
  return () => { clearTimeout(timer); ++recordsRequestId.current; };
  }, [currentPage, filterStatus, searchQuery]);

  const searchBooks = async (query: string) => {
    const requestId = ++bookSearchId.current;
    setBookSearchLoading(true);
    setBookSearchError('');
    try {
      const page = await api.getBooks(query, 1, 20, true);
      if (requestId === bookSearchId.current) setAvailableBooks(page.books);
    } catch (err: any) {
      if (requestId === bookSearchId.current) setBookSearchError(err.message);
    } finally {
      if (requestId === bookSearchId.current) setBookSearchLoading(false);
    }
  };

  const searchStudents = async (query: string) => {
    const requestId = ++studentSearchId.current;
    setStudentSearchLoading(true);
    setStudentSearchError('');
    try {
      const page = await api.getStudents(query, 1, 20);
      if (requestId === studentSearchId.current) setStudents(page.students);
    } catch (err: any) {
      if (requestId === studentSearchId.current) setStudentSearchError(err.message);
    } finally {
      if (requestId === studentSearchId.current) setStudentSearchLoading(false);
    }
  };

  useEffect(() => {
    if (!isModalOpen) return;
    ++bookSearchId.current;
    setBookSearchLoading(true);
    const timer = setTimeout(() => { searchBooks(bookSearch); }, 250);
    return () => clearTimeout(timer);
  }, [isModalOpen, bookSearch]);

  useEffect(() => {
    if (!isModalOpen) return;
    ++studentSearchId.current;
    setStudentSearchLoading(true);
    const timer = setTimeout(() => { searchStudents(studentSearch); }, 250);
    return () => clearTimeout(timer);
  }, [isModalOpen, studentSearch]);

  useEffect(() => {
    if (preSelectedBookForBorrow) {
      setAvailableBooks([preSelectedBookForBorrow]);
      setBookSearch(preSelectedBookForBorrow.title);
      setSelectedBookId(preSelectedBookForBorrow.bookId);
      setSelectedCopyId(preSelectedBookForBorrow.bookCopies.find(c => c.isAvailable)?.bookCopyId || '');
      setIsModalOpen(true);
    }
  }, [preSelectedBookForBorrow]);

  const handleOpenModal = () => {
    if (!checkAuth()) return;
    setBookSearch('');
    setStudentSearch('');
    setSelectedBookId('');
    setSelectedCopyId('');
    setSelectedStudentId('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onClearPreSelectedBook) onClearPreSelectedBook();
  };

  const handleIssueLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!selectedCopyId || !selectedStudentId) {
      onAddToast('error', 'Validation Error', 'Please select a student and available copy.');
      return;
    }

    const dueDateValue = dueDateUtc(dueDate);
    if (!dueDateValue) {
      onAddToast('error', 'Invalid Due Date', 'Choose today or a future local date.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.borrowBook({
        studentId: Number(selectedStudentId),
        bookCopyId: Number(selectedCopyId),
        dueDate: dueDateValue,
      });

      onAddToast(
        'success',
        'Loan Record Created',
        'Book copy issued successfully.'
      );
      handleCloseModal();
      await fetchRecords();
    } catch (err: any) {
      onAddToast('error', 'Failed to Issue Loan', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnConfirm = async () => {
    if (!returningRecordId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.returnBook(returningRecordId);
      onAddToast(
        'success',
        'Book Marked Returned',
        `Transaction #${returningRecordId} updated successfully.`
      );
      setReturningRecordId(null);
      await fetchRecords();
    } catch (err: any) {
      onAddToast('error', 'Return Operation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogRef = useDialog(isModalOpen, handleCloseModal, isSubmitting);

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ocean">Borrow Records</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Track active circulation loans and book return confirmations
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="px-5 py-2.5 bg-classic-teal hover:bg-persian text-white font-medium text-sm rounded-lg shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-cream" />
          <span>+ New Record</span>
        </button>
      </div>

      <section aria-label="Borrowing records" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              aria-label="Search loans by borrower, book, or accession number"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search record or borrower..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
            <button
              aria-pressed={filterStatus === 'all'}
              onClick={() => { setFilterStatus('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === 'all'
                  ? 'bg-classic-teal text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Records
            </button>
            <button
              aria-pressed={filterStatus === 'borrowed'}
              onClick={() => { setFilterStatus('borrowed'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === 'borrowed'
                  ? 'bg-ocean text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Active Loans
            </button>
            <button
              aria-pressed={filterStatus === 'returned'}
              onClick={() => { setFilterStatus('returned'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === 'returned'
                  ? 'bg-persian text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Returned
            </button>
            <button aria-pressed={filterStatus === 'overdue'}
              onClick={() => { setFilterStatus('overdue'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${filterStatus === 'overdue' ? 'bg-rose-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              Overdue
            </button>
            <button
              onClick={fetchRecords}
              disabled={isLoading}
              className="p-1.5 text-slate-500 hover:text-classic-teal rounded-lg transition-colors ml-2"
              title="Refresh records"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Borrow Records Data Table */}
        {loadError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{loadError}</p>}
        <div className="bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-100 text-slate-600 text-xs tracking-wide font-semibold">
                <tr>
                  <th className="py-4 px-4 xl:px-6">Book</th>
                  <th className="py-4 px-4 xl:px-6">Borrower</th>
                  <th className="py-4 px-4 xl:px-6">Borrow Date</th>
                  <th className="py-4 px-4 xl:px-6">Due Date</th>
                  <th className="py-4 px-4 xl:px-6">Return Date</th>
                  <th className="py-4 px-4 xl:px-6">Status</th>
                  <th className="py-4 px-4 xl:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-classic-teal border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs font-medium">Fetching borrow records...</span>
                      </div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No borrowing transactions match your query.
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => (
                    <tr key={rec.borrowRecordId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4 xl:px-6 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-classic-teal shrink-0" />
                          <span>{rec.bookTitle} · {rec.accessionNumber}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 xl:px-6">
                        <div className="font-semibold text-slate-800">{rec.studentName}</div>
                        <div className="text-xs text-slate-500">{rec.studentEmail}</div>
                      </td>
                      <td className="py-4 px-4 xl:px-6 font-mono text-xs">
                        {localDate(rec.borrowDate)}
                      </td>
                      <td className="py-4 px-4 xl:px-6 font-mono text-xs">
                        {localDate(rec.dueDate)}
                      </td>
                      <td className="py-4 px-4 xl:px-6 font-mono text-xs">
                        {rec.returnDate ? (
                          localDate(rec.returnDate)
                        ) : (
                          <span className="text-slate-300 font-bold">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4 xl:px-6">
                        {isOverdue(rec) ? (
                          <StatusBadge tone="danger">Overdue</StatusBadge>
                        ) : !rec.returnDate ? (
                          <StatusBadge tone="warning">Borrowed</StatusBadge>
                        ) : (
                          <StatusBadge tone="success">Returned</StatusBadge>
                        )}
                      </td>
                      <td className="py-4 px-4 xl:px-6 text-right space-x-2 whitespace-nowrap whitespace-nowrap whitespace-nowrap whitespace-nowrap">
                        {!rec.returnDate && (
                          <button
                            onClick={() => {
                              if (checkAuth()) setReturningRecordId(rec.borrowRecordId);
                            }}
                            className="px-3 py-1.5 bg-classic-teal text-white hover:bg-persian rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-cream" />
                            Mark Returned
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination page={currentPage} totalPages={totalPages} totalItems={totalItems} busy={isLoading} onPage={setCurrentPage} />

      </section>

      {/* New Loan Record Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isSubmitting) handleCloseModal(); }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Issue Book Loan"
              className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-ocean text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-classic-teal rounded-xl">
                    <Clock className="w-5 h-5 text-cream" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg font-serif">Issue Book Loan</h3>
                    <p className="text-xs text-cream/90">Circulation Checkout</p>
                  </div>
                </div>
                <button aria-label="Close dialog"
                  onClick={() => { if (!isSubmitting) handleCloseModal(); }}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleIssueLoan} className="p-6 space-y-4">
                <div>
                  <label htmlFor="loan-book-search" className="text-xs font-semibold text-slate-700 block mb-1">Find Book</label>
                  <input id="loan-book-search" value={bookSearch}
                    onChange={e => { setBookSearch(e.target.value); setSelectedBookId(''); setSelectedCopyId(''); }}
                    placeholder="Title, author or ISBN" className="w-full px-3.5 py-2.5 mb-2 rounded-xl border border-slate-200 text-sm" />
                  <label htmlFor="loan-book" className="text-xs font-semibold text-slate-700 block mb-1">Select Book *</label>
                  <select
                    id="loan-book"
                    required
                    value={selectedBookId}
                    onChange={(e) => { setSelectedBookId(Number(e.target.value)); setSelectedCopyId(''); }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  >
                    <option value="">-- Choose an available book --</option>
                    {availableBooks.filter(b => b.isAvailable || b.bookId === selectedBookId).map((b) => (
                      <option key={b.bookId} value={b.bookId}>
                        {b.title} (By {b.author}) · {b.availableCopyCount} available
                      </option>
                    ))}
                  </select>
                  {bookSearchLoading ? <p className="text-xs text-slate-600 mt-1">Searching available titles…</p>
                    : bookSearchError ? <p role="alert" className="text-xs text-rose-700 mt-1">{bookSearchError}</p>
                    : availableBooks.length === 0 ? <p className="text-xs text-slate-600 mt-1">No available copies match. Try another title or add a copy in Books.</p>
                    : <p className="text-xs text-slate-500 mt-1">Showing the first 20 matching titles with available copies.</p>}
                </div>

                <div>
                  <label htmlFor="loan-copy" className="text-xs font-semibold text-slate-700 block mb-1">Physical Copy *</label>
                  <select id="loan-copy" required value={selectedCopyId} onChange={(e) => setSelectedCopyId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm">
                    <option value="">-- Choose an available copy --</option>
                    {availableBooks.find(b => b.bookId === selectedBookId)?.bookCopies.filter(c => c.isAvailable).map(c =>
                      <option key={c.bookCopyId} value={c.bookCopyId}>{c.accessionNumber} · {c.condition || 'Condition unrecorded'}</option>)}
                  </select>
                </div>

                <div>
                  <label htmlFor="loan-student-search" className="text-xs font-semibold text-slate-700 block mb-1">Find Student</label>
                  <input id="loan-student-search" value={studentSearch}
                    onChange={e => { setStudentSearch(e.target.value); setSelectedStudentId(''); }}
                    placeholder="Name or registration number" className="w-full px-3.5 py-2.5 mb-2 rounded-xl border border-slate-200 text-sm" />
                  <label htmlFor="loan-student" className="text-xs font-semibold text-slate-700 block mb-1">Registered Student *</label>
                  <select id="loan-student" required value={selectedStudentId} onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm">
                    <option value="">-- Choose a registered student --</option>
                    {students.map(s => <option key={s.studentId} value={s.studentId}>{s.studentName} · {s.registrationNumber}</option>)}
                  </select>
                  {studentSearchLoading ? <p className="text-xs text-slate-600 mt-1">Searching students…</p>
                    : studentSearchError ? <p role="alert" className="text-xs text-rose-700 mt-1">{studentSearchError}</p>
                    : students.length === 0 ? <p className="text-xs text-slate-600 mt-1">No students match. Register a student first.</p>
                    : <p className="text-xs text-slate-500 mt-1">Showing the first 20 matching students.</p>}
                </div>

                <div>
                  <label htmlFor="loan-due-date" className="text-xs font-semibold text-slate-700 block mb-1">Due Date *</label>
                  <input
                    id="loan-due-date"
                    type="date"
                    required
                    min={localDateInput()}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { if (!isSubmitting) handleCloseModal(); }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-classic-teal hover:bg-persian text-white text-sm font-medium rounded-xl transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Issue Loan Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Return Confirmation Modal */}
      <ConfirmModal
        isOpen={returningRecordId !== null}
        title="Mark Book as Returned"
        message="Record this copy as returned? It will be available again if its physical status allows circulation."
        confirmText="Confirm Return"
        type="info"
        isLoading={isSubmitting}
        onConfirm={handleReturnConfirm}
        onCancel={() => setReturningRecordId(null)}
      />

    </div>
  );
};
