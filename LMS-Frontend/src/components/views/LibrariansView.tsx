import { useDialog } from '../useDialog';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCheck,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { Librarian, LibrarianListResponseDto } from '../../types/api';
import { ConfirmModal } from '../ConfirmModal';
import { StaffAccountsPanel } from '../StaffAccountsPanel';

interface LibrariansViewProps {
  onAddToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onRequestAuth?: (promptMessage?: string) => void;
}

export const LibrariansView: React.FC<LibrariansViewProps> = ({ onAddToast, onRequestAuth }) => {
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

  const [data, setData] = useState<LibrarianListResponseDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLibrarian, setEditingLibrarian] = useState<Librarian | null>(null);
  const [deletingLibrarianId, setDeletingLibrarianId] = useState<number | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>(35);
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLibrarians = async (query: string = searchTerm, page: number = currentPage) => {
    setIsLoading(true);
    try {
      const res = await api.getLibrarians(query, page, 5);
      setData(res);
    } catch (err: any) {
      onAddToast('error', 'Failed to fetch librarians', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrarians(searchTerm, currentPage);
  }, [currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLibrarians(searchTerm, 1);
  };

  const openAddModal = () => {
    if (!checkAuth()) return;
    setEditingLibrarian(null);
    setName('');
    setAge(32);
    setPhone('');
    setIsModalOpen(true);
  };

  const openEditModal = (lib: Librarian) => {
    if (!checkAuth()) return;
    setEditingLibrarian(lib);
    setName(lib.name);
    setAge(lib.age);
    setPhone(lib.phone);
    setIsModalOpen(true);
  };

  const handleSaveLibrarian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        age: Number(age) || 30,
        phone,
      };

      if (editingLibrarian) {
        await api.updateLibrarian(editingLibrarian.librarianId, payload);
        onAddToast('success', 'Librarian Updated', `${name}'s staff record updated.`);
      } else {
        await api.addLibrarian(payload);
        onAddToast('success', 'Librarian Added', `${name} added to staff roster.`);
      }

      setIsModalOpen(false);
      fetchLibrarians(searchTerm, currentPage);
    } catch (err: any) {
      onAddToast('error', 'Save Librarian Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingLibrarianId) return;
    setIsSubmitting(true);
    try {
      await api.deleteLibrarian(deletingLibrarianId);
      onAddToast('success', 'Librarian Removed', `Librarian ID #${deletingLibrarianId} deleted.`);
      setDeletingLibrarianId(null);
      fetchLibrarians(searchTerm, currentPage);
    } catch (err: any) {
      onAddToast('error', 'Delete Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogRef = useDialog(isModalOpen, () => setIsModalOpen(false), isSubmitting);

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-serif text-ocean">Librarians Staff Roster</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage library staff directory and contact profiles
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-classic-teal hover:bg-persian text-white font-medium text-sm rounded-2xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-cream" />
          <span>Add New Librarian</span>
        </button>
      </div>

      <StaffAccountsPanel onAddToast={onAddToast} />

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-classic-teal/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search librarian name or phone..."
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
          Showing <span className="font-semibold text-ocean">{data?.librarians.length || 0}</span> of{' '}
          <span className="font-semibold text-ocean">{data?.totalItems || 0}</span> staff
        </div>
      </div>

      {/* Librarians Data Table */}
      <div className="bg-white rounded-3xl border border-classic-teal/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-ocean text-white uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Age</th>
                <th className="py-4 px-6">Phone Number</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-classic-teal border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Fetching librarians list...</span>
                    </div>
                  </td>
                </tr>
              ) : data?.librarians.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No librarian records found matching query.
                  </td>
                </tr>
              ) : (
                data?.librarians.map((lib) => (
                  <tr key={lib.librarianId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-slate-500 font-semibold">
                      #{lib.librarianId}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-classic-teal shrink-0" />
                        <span>{lib.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-medium">{lib.age} yrs</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">{lib.phone}</td>
                    <td className="py-4 px-6 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(lib)}
                        className="px-2.5 py-1.5 bg-cream/80 text-ocean hover:bg-cream rounded-lg text-xs font-semibold transition-colors border border-cream"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (checkAuth()) setDeletingLibrarianId(lib.librarianId);
                        }}
                        className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Delete
                      </button>
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

      {/* Add / Edit Librarian Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { if (!isSubmitting) setIsModalOpen(false); }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Librarian directory record"
              className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-ocean text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-classic-teal rounded-xl">
                    <UserCheck className="w-5 h-5 text-cream" />
                  </div>
                  <h3 className="font-semibold text-white text-lg font-serif">
                    {editingLibrarian ? 'Edit Librarian Record' : 'Add New Librarian'}
                  </h3>
                </div>
                <button
                  onClick={() => { if (!isSubmitting) setIsModalOpen(false); }}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveLibrarian} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1" htmlFor="librariansview-field-1">
                    Staff Name
                  </label>
                  <input id="librariansview-field-1"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Eleanor Vance"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1" htmlFor="librariansview-field-2">
                      Age
                    </label>
                    <input id="librariansview-field-2"
                      type="number"
                      required
                      min={18}
                      max={100}
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      placeholder="35"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1" htmlFor="librariansview-field-3">
                      Phone Number
                    </label>
                    <input id="librariansview-field-3"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555-0301"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { if (!isSubmitting) setIsModalOpen(false); }}
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
                    {editingLibrarian ? 'Update Librarian' : 'Save Staff Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingLibrarianId !== null}
        title="Delete Staff Record"
        message={`Are you sure you want to delete librarian ID #${deletingLibrarianId}?`}
        confirmText="Delete Librarian"
        type="danger"
        isLoading={isSubmitting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingLibrarianId(null)}
      />
    </div>
  );
};
