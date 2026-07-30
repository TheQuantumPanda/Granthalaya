import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Search,
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  BookmarkPlus,
} from 'lucide-react';
import { api } from '../../services/api';
import { Book, BookListResponseDto } from '../../types/api';
import { ConfirmModal } from '../ConfirmModal';

interface BooksViewProps {
  onAddToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onIssueBorrowForBook?: (book: Book) => void;
  onRequestAuth?: (promptMessage?: string) => void;
}

export const BooksView: React.FC<BooksViewProps> = ({
  onAddToast,
  onIssueBorrowForBook,
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

  const [data, setData] = useState<BookListResponseDto | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBookId, setDeletingBookId] = useState<number | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [borrowingBook, setBorrowingBook] = useState<Book | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formIsbn, setFormIsbn] = useState('');
  const [formPublishedDate, setFormPublishedDate] = useState('');
  const [formIsAvailable, setFormIsAvailable] = useState(true);
  const [formGenre, setFormGenre] = useState('General');
  const [formCopies, setFormCopies] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Borrow Form state
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');

  const fetchBooks = async (query: string = searchQuery, page: number = currentPage) => {
    setIsLoading(true);
    try {
      const res = await api.getBooks(query, page, 5);
      setData(res);
    } catch (err: any) {
      onAddToast('error', 'Error Fetching Books', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(searchQuery, currentPage);
  }, [currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBooks(searchQuery, 1);
  };

  const openAddModal = () => {
    if (!checkAuth()) return;
    setEditingBook(null);
    setFormTitle('');
    setFormAuthor('');
    setFormIsbn(`978-${Math.floor(100000000 + Math.random() * 900000000)}`);
    setFormPublishedDate(new Date().toISOString().split('T')[0]);
    setFormIsAvailable(true);
    setFormGenre('Fiction');
    setFormCopies(3);
    setIsAddOpen(true);
  };

  const openEditModal = (book: Book) => {
    if (!checkAuth()) return;
    setEditingBook(book);
    setFormTitle(book.title);
    setFormAuthor(book.author);
    setFormIsbn(book.isbn);
    setFormPublishedDate(
      book.publishedDate ? new Date(book.publishedDate).toISOString().split('T')[0] : ''
    );
    setFormIsAvailable(book.isAvailable);
    setFormGenre(book.genre || 'General');
    setFormCopies(book.copies ?? 1);
    setIsAddOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        title: formTitle,
        author: formAuthor,
        isbn: formIsbn,
        publishedDate: formPublishedDate ? new Date(formPublishedDate).toISOString() : new Date().toISOString(),
        isAvailable: formIsAvailable,
        genre: formGenre,
        copies: Number(formCopies),
      };

      if (editingBook) {
        await api.updateBook(editingBook.bookId, payload);
        onAddToast('success', 'Book Updated', `"${formTitle}" has been updated successfully.`);
      } else {
        await api.addBook(payload);
        onAddToast('success', 'Book Created', `"${formTitle}" added to the library catalog.`);
      }

      setIsAddOpen(false);
      fetchBooks(searchQuery, currentPage);
    } catch (err: any) {
      onAddToast('error', 'Failed to Save Book', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBookId) return;
    setIsSubmitting(true);
    try {
      await api.deleteBook(deletingBookId);
      onAddToast('success', 'Book Removed', `Book ID #${deletingBookId} deleted from catalog.`);
      setDeletingBookId(null);
      fetchBooks(searchQuery, currentPage);
    } catch (err: any) {
      onAddToast('error', 'Delete Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowingBook) return;
    setIsSubmitting(true);
    try {
      await api.borrowBook({
        bookId: borrowingBook.bookId,
        borrowerName,
        borrowerEmail,
        phone: borrowerPhone,
      });
      onAddToast(
        'success',
        'Book Borrowed',
        `"${borrowingBook.title}" issued to ${borrowerName} successfully!`
      );
      setBorrowingBook(null);
      setBorrowerName('');
      setBorrowerEmail('');
      setBorrowerPhone('');
      fetchBooks(searchQuery, currentPage);
    } catch (err: any) {
      onAddToast('error', 'Borrow Request Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-serif text-ocean">Books Catalog</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage titles, author metadata, ISBN records, and circulation availability
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-classic-teal hover:bg-persian text-white font-medium text-sm rounded-2xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-cream" />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-classic-teal/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, or ISBN..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        <div className="text-xs text-slate-500 self-end sm:self-auto">
          Showing <span className="font-semibold text-ocean">{data?.books.length || 0}</span> of{' '}
          <span className="font-semibold text-ocean">{data?.totalItems || 0}</span> items
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-classic-teal/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-ocean text-white uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">Title</th>
                <th className="py-4 px-6">Author</th>
                <th className="py-4 px-6">ISBN</th>
                <th className="py-4 px-6">Published Date</th>
                <th className="py-4 px-6">Availability</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-classic-teal border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Fetching catalog items...</span>
                    </div>
                  </td>
                </tr>
              ) : data?.books.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No books matching your criteria found.
                  </td>
                </tr>
              ) : (
                data?.books.map((book) => (
                  <tr key={book.bookId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{book.title}</div>
                      {book.genre && (
                        <span className="inline-block mt-0.5 text-[10px] font-medium bg-cream/70 text-ocean px-2 py-0.5 rounded-md border border-cream">
                          {book.genre}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">{book.author}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-500">{book.isbn}</td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {book.publishedDate
                        ? new Date(book.publishedDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      {book.isAvailable ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-mint/20 text-ocean border border-mint/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-mint" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Out of stock
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1">
                      <button
                        onClick={() => setViewingBook(book)}
                        title="Book Details"
                        className="px-2.5 py-1.5 bg-slate-100 text-ocean hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => openEditModal(book)}
                        title="Edit Book"
                        className="px-2.5 py-1.5 bg-cream/80 text-ocean hover:bg-cream rounded-lg text-xs font-semibold transition-colors border border-cream"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (checkAuth()) setDeletingBookId(book.bookId);
                        }}
                        title="Delete Book"
                        className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Delete
                      </button>
                      {book.isAvailable && (
                        <button
                          onClick={() => {
                            if (!checkAuth()) return;
                            if (onIssueBorrowForBook) {
                              onIssueBorrowForBook(book);
                            } else {
                              setBorrowingBook(book);
                            }
                          }}
                          title="Borrow Book"
                          className="px-2.5 py-1.5 bg-classic-teal hover:bg-persian text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                        >
                          Borrow
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {data && data.totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white hover:bg-slate-100 transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === pageNum
                      ? 'bg-classic-teal text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={currentPage === data.totalPages}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white hover:bg-slate-100 transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Book Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
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
                    <BookOpen className="w-5 h-5 text-cream" />
                  </div>
                  <h3 className="font-semibold text-white text-lg font-serif">
                    {editingBook ? 'Edit Book Record' : 'Add New Book'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBook} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Book Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Enter book title"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Author
                  </label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="Enter author's name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      ISBN
                    </label>
                    <input
                      type="text"
                      required
                      value={formIsbn}
                      onChange={(e) => setFormIsbn(e.target.value)}
                      placeholder="978-1234567890"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Published Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formPublishedDate}
                      onChange={(e) => setFormPublishedDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Genre / Category
                    </label>
                    <input
                      type="text"
                      value={formGenre}
                      onChange={(e) => setFormGenre(e.target.value)}
                      placeholder="Fiction, Technology, etc."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Availability Status
                    </label>
                    <select
                      value={formIsAvailable ? 'true' : 'false'}
                      onChange={(e) => setFormIsAvailable(e.target.value === 'true')}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    >
                      <option value="true">Available</option>
                      <option value="false">Out of Stock / Reserved</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
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
                    {editingBook ? 'Update Book' : 'Add Book'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Borrow Book Modal */}
      <AnimatePresence>
        {borrowingBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBorrowingBook(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-ocean text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-classic-teal rounded-xl">
                    <BookmarkPlus className="w-5 h-5 text-cream" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg font-serif">Issue Book Loan</h3>
                    <p className="text-xs text-cream/90">Circulation Checkout</p>
                  </div>
                </div>
                <button
                  onClick={() => setBorrowingBook(null)}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleBorrowSubmit} className="p-6 space-y-4">
                <div className="p-3 bg-cream/80 rounded-xl border border-cream text-xs">
                  <span className="font-semibold text-ocean block">{borrowingBook.title}</span>
                  <span className="text-ocean/80">Author: {borrowingBook.author} (ID: #{borrowingBook.bookId})</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Borrower Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    placeholder="e.g. Aditi Sharma"
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
                    placeholder="e.g. aditi.sharma@university.edu"
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
                    value={borrowerPhone}
                    onChange={(e) => setBorrowerPhone(e.target.value)}
                    placeholder="+1 555-0142"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBorrowingBook(null)}
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
                    Confirm Issue Loan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Book Details Modal */}
      <AnimatePresence>
        {viewingBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingBook(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-ocean text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-classic-teal rounded-xl">
                    <Info className="w-5 h-5 text-cream" />
                  </div>
                  <h3 className="font-semibold text-white text-lg font-serif">Book Details</h3>
                </div>
                <button
                  onClick={() => setViewingBook(null)}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-xl font-bold font-serif text-ocean">{viewingBook.title}</h4>
                  <p className="text-sm font-medium text-slate-600 mt-1">By {viewingBook.author}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block font-semibold">Book ID</span>
                    <span className="font-mono font-bold text-ocean">#{viewingBook.bookId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Genre</span>
                    <span className="font-medium text-slate-800">{viewingBook.genre || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">ISBN</span>
                    <span className="font-mono text-slate-800">{viewingBook.isbn}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Published Date</span>
                    <span className="text-slate-800">
                      {viewingBook.publishedDate
                        ? new Date(viewingBook.publishedDate).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    Stock Status
                  </span>
                  {viewingBook.isAvailable ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-mint/20 text-ocean border border-mint/40">
                      Available
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end px-6 py-4 bg-slate-50 border-t border-slate-100">
                <button
                  onClick={() => setViewingBook(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingBookId !== null}
        title="Delete Book"
        message={`Are you sure you want to delete book ID #${deletingBookId}? This operation cannot be undone.`}
        confirmText="Delete Book"
        type="danger"
        isLoading={isSubmitting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingBookId(null)}
      />
    </div>
  );
};
