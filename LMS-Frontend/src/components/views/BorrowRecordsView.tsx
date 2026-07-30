import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Clock,
  Plus,
  CheckCircle2,
  Trash2,
  BookOpen,
  X,
  RefreshCw,
  Search,
} from 'lucide-react';
import { api } from '../../services/api';
import { Book, BorrowRecord } from '../../types/api';
import { ConfirmModal } from '../ConfirmModal';

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
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'borrowed' | 'returned'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Loan Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | ''>('');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Return confirmation
  const [returningRecordId, setReturningRecordId] = useState<number | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null);

  const fetchRecordsAndBooks = async () => {
    setIsLoading(true);
    try {
      const [recs, bookRes] = await Promise.all([
        api.getBorrowRecords(),
        api.getBooks('', 1, 100),
      ]);
      setRecords(recs);
      setAvailableBooks(bookRes.books);
    } catch (err: any) {
      onAddToast('error', 'Error Loading Borrow Records', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordsAndBooks();
  }, []);

  useEffect(() => {
    if (preSelectedBookForBorrow) {
      setSelectedBookId(preSelectedBookForBorrow.bookId);
      setIsModalOpen(true);
    }
  }, [preSelectedBookForBorrow]);

  const handleOpenModal = () => {
    if (!checkAuth()) return;
    setSelectedBookId(availableBooks.find((b) => b.isAvailable)?.bookId || '');
    setBorrowerName('');
    setBorrowerEmail('');
    setPhone('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (onClearPreSelectedBook) onClearPreSelectedBook();
  };

  const handleIssueLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) {
      onAddToast('error', 'Validation Error', 'Please select a book to issue.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.borrowBook({
        bookId: Number(selectedBookId),
        borrowerName,
        borrowerEmail,
        phone,
      });

      onAddToast(
        'success',
        'Loan Record Created',
        `Book loan issued to ${borrowerName} successfully.`
      );
      handleCloseModal();
      fetchRecordsAndBooks();
    } catch (err: any) {
      onAddToast('error', 'Failed to Issue Loan', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnConfirm = async () => {
    if (!returningRecordId) return;
    setIsSubmitting(true);
    try {
      await api.returnBook(returningRecordId);
      onAddToast(
        'success',
        'Book Marked Returned',
        `Transaction #${returningRecordId} updated successfully.`
      );
      setReturningRecordId(null);
      fetchRecordsAndBooks();
    } catch (err: any) {
      onAddToast('error', 'Return Operation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecord = async () => {
    if (!deletingRecordId) return;
    setIsSubmitting(true);
    try {
      await api.deleteBorrowRecord(deletingRecordId);
      onAddToast('info', 'Record Deleted', `Borrow transaction record #${deletingRecordId} deleted.`);
      setDeletingRecordId(null);
      fetchRecordsAndBooks();
    } catch (err: any) {
      onAddToast('error', 'Failed to delete record', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter logic
  const filteredRecords = records.filter((rec) => {
    if (filterStatus === 'borrowed' && rec.returnDate) return false;
    if (filterStatus === 'returned' && !rec.returnDate) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const bookTitle = rec.book?.title?.toLowerCase() || '';
      return (
        bookTitle.includes(q) ||
        rec.borrowerName.toLowerCase().includes(q) ||
        rec.borrowerEmail.toLowerCase().includes(q) ||
        rec.phone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-serif text-ocean">Borrow Records</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Track active circulation loans and book return confirmations
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="px-5 py-2.5 bg-classic-teal hover:bg-persian text-white font-medium text-sm rounded-2xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-cream" />
          <span>+ New Record</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-classic-teal/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search record or borrower..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'all'
                ? 'bg-classic-teal text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Records
          </button>
          <button
            onClick={() => setFilterStatus('borrowed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'borrowed'
                ? 'bg-ocean text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Active Loans
          </button>
          <button
            onClick={() => setFilterStatus('returned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'returned'
                ? 'bg-persian text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Returned
          </button>
          <button
            onClick={fetchRecordsAndBooks}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-classic-teal rounded-lg transition-colors ml-2"
            title="Refresh records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Borrow Records Data Table */}
      <div className="bg-white rounded-3xl border border-classic-teal/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-ocean text-white uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">Book</th>
                <th className="py-4 px-6">Borrower</th>
                <th className="py-4 px-6">Borrow Date</th>
                <th className="py-4 px-6">Return Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-classic-teal border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Fetching borrow records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No borrowing transactions match your query.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.borrowRecordId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-classic-teal shrink-0" />
                        <span>{rec.book?.title || `Book #${rec.bookId}`}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800">{rec.borrowerName}</div>
                      <div className="text-xs text-slate-400">{rec.borrowerEmail}</div>
                      <div className="text-xs text-slate-400">{rec.phone}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {new Date(rec.borrowDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {rec.returnDate ? (
                        new Date(rec.returnDate).toLocaleDateString()
                      ) : (
                        <span className="text-slate-300 font-bold">—</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {!rec.returnDate ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cream text-ocean border border-cream">
                          <span className="w-1.5 h-1.5 rounded-full bg-classic-teal animate-pulse"></span>
                          Borrowed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-mint/20 text-ocean border border-mint/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-mint"></span>
                          Returned
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
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
                      <button
                        onClick={() => {
                          if (checkAuth()) setDeletingRecordId(rec.borrowRecordId);
                        }}
                        className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Loan Record Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
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
                <button
                  onClick={handleCloseModal}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleIssueLoan} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Select Book
                  </label>
                  <select
                    required
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  >
                    <option value="">-- Choose an available book --</option>
                    {availableBooks.map((b) => (
                      <option key={b.bookId} value={b.bookId}>
                        {b.title} (By {b.author}) {b.isAvailable ? '✓ Available' : '⚠ Out of Stock'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Borrower Name
                  </label>
                  <input
                    type="text"
                    required
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    placeholder="Enter student or faculty name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Borrower Email
                  </label>
                  <input
                    type="email"
                    required
                    value={borrowerEmail}
                    onChange={(e) => setBorrowerEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleCloseModal}
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
        message="Are you sure you want to record this book as returned? This will update the return timestamp and restore the book's availability status."
        confirmText="Confirm Return"
        type="info"
        isLoading={isSubmitting}
        onConfirm={handleReturnConfirm}
        onCancel={() => setReturningRecordId(null)}
      />

      {/* Delete Record Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingRecordId !== null}
        title="Delete Transaction Record"
        message={`Are you sure you want to permanently delete transaction record #${deletingRecordId}?`}
        confirmText="Delete Record"
        type="danger"
        isLoading={isSubmitting}
        onConfirm={handleDeleteRecord}
        onCancel={() => setDeletingRecordId(null)}
      />
    </div>
  );
};
