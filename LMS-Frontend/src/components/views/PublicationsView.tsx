import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Newspaper,
  BookMarked,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { api } from '../../services/api';
import { Publication, PublicationType } from '../../types/api';
import { ConfirmModal } from '../ConfirmModal';

interface PublicationsViewProps {
  onAddToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onRequestAuth?: (promptMessage?: string) => void;
}

export const PublicationsView: React.FC<PublicationsViewProps> = ({
  onAddToast,
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
  const [activeTypeTab, setActiveTypeTab] = useState<'Newspaper' | 'Magazine'>('Newspaper');
  const [publications, setPublications] = useState<Publication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPub, setEditingPub] = useState<Publication | null>(null);
  const [deletingPubId, setDeletingPubId] = useState<number | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishedDate, setPublishedDate] = useState('');
  const [pubType, setPubType] = useState<PublicationType>('Newspaper');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPublications = async (
    type: 'Newspaper' | 'Magazine' = activeTypeTab,
    query: string = searchTerm,
    page: number = currentPage
  ) => {
    setIsLoading(true);
    try {
      const res = await api.getPublications(type, query, page, 5);
      setPublications(res.publications);
      setTotalPages(res.totalPages);
      setTotalItems(res.totalItems);
    } catch (err: any) {
      onAddToast('error', 'Error Fetching Publications', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPublications(activeTypeTab, searchTerm, currentPage);
  }, [activeTypeTab, currentPage]);

  const handleTabChange = (type: 'Newspaper' | 'Magazine') => {
    setActiveTypeTab(type);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPublications(activeTypeTab, searchTerm, 1);
  };

  const openAddModal = () => {
    if (!checkAuth()) return;
    setEditingPub(null);
    setTitle('');
    setPublisher('');
    setPublishedDate(new Date().toISOString().split('T')[0]);
    const defaultType = activeTypeTab === 'Magazine' ? 1 : 0;
    setPubType(defaultType);
    setIsAvailable(true);
    setIsModalOpen(true);
  };

  const openEditModal = (pub: Publication) => {
    if (!checkAuth()) return;
    setEditingPub(pub);
    setTitle(pub.title);
    setPublisher(pub.publisher);
    setPublishedDate(
      pub.publishedDate ? new Date(pub.publishedDate).toISOString().split('T')[0] : ''
    );
    const numericType = pub.type === 1 || pub.type === 'Magazine' ? 1 : 0;
    setPubType(numericType);
    setIsAvailable(pub.isAvailable);
    setIsModalOpen(true);
  };

  const handleSavePublication = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const typeDiscriminator =
        pubType === 1 || pubType === 'Magazine'
          ? 1
          : pubType === 0 || pubType === 'Newspaper'
          ? 0
          : activeTypeTab === 'Magazine'
          ? 1
          : 0;

      const payload = {
        title: title.trim(),
        publisher: publisher.trim(),
        publishedDate: publishedDate ? new Date(publishedDate).toISOString() : new Date().toISOString(),
        type: typeDiscriminator,
        isAvailable: isAvailable ?? true,
      };

      if (editingPub) {
        await api.updatePublication(editingPub.id, payload as any);
        onAddToast('success', 'Publication Updated', `"${title.trim()}" updated.`);
      } else {
        await api.addPublication(payload as any);
        onAddToast('success', 'Publication Created', `"${title.trim()}" added.`);
      }

      setIsModalOpen(false);
      fetchPublications(activeTypeTab, searchTerm, currentPage);
    } catch (err: any) {
      onAddToast('error', 'Validation Error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPubId) return;
    setIsSubmitting(true);
    try {
      await api.deletePublication(deletingPubId);
      onAddToast('success', 'Publication Deleted', `Publication #${deletingPubId} deleted.`);
      setDeletingPubId(null);
      fetchPublications(activeTypeTab, searchTerm, currentPage);
    } catch (err: any) {
      onAddToast('error', 'Delete Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-serif text-ocean">Publications Directory</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Newspaper & Magazine serials catalog
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-classic-teal hover:bg-persian text-white font-medium text-sm rounded-2xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-cream" />
          <span>Add Publication</span>
        </button>
      </div>

      {/* Tab Switcher: Newspapers vs Magazines */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => handleTabChange('Newspaper')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTypeTab === 'Newspaper'
              ? 'border-classic-teal text-ocean bg-cream/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Newspaper className="w-4 h-4 text-classic-teal" />
          <span>Newspapers</span>
        </button>
        <button
          onClick={() => handleTabChange('Magazine')}
          className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTypeTab === 'Magazine'
              ? 'border-classic-teal text-ocean bg-cream/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookMarked className="w-4 h-4 text-classic-teal" />
          <span>Magazines</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-classic-teal/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search ${activeTypeTab.toLowerCase()}s by title or publisher...`}
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
          Showing <span className="font-semibold text-ocean">{publications.length}</span> of{' '}
          <span className="font-semibold text-ocean">{totalItems}</span> {activeTypeTab.toLowerCase()}s
        </div>
      </div>

      {/* Publications Data Table */}
      <div className="bg-white rounded-3xl border border-classic-teal/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-ocean text-white uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Title</th>
                <th className="py-4 px-6">Publisher</th>
                <th className="py-4 px-6">Release Date</th>
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
                      <span className="text-xs font-medium">Fetching publications list...</span>
                    </div>
                  </td>
                </tr>
              ) : publications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No {activeTypeTab.toLowerCase()} records found.
                  </td>
                </tr>
              ) : (
                publications.map((pub) => (
                  <tr key={pub.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-slate-500 font-semibold">
                      #{pub.id}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-900">{pub.title}</td>
                    <td className="py-4 px-6 font-medium text-slate-700">{pub.publisher}</td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {pub.publishedDate
                        ? new Date(pub.publishedDate).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      {pub.isAvailable ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-mint/20 text-ocean border border-mint/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-mint font-bold" />
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(pub)}
                        className="px-2.5 py-1.5 bg-cream/80 text-ocean hover:bg-cream rounded-lg text-xs font-semibold transition-colors border border-cream"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (checkAuth()) setDeletingPubId(pub.id);
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
        {totalPages > 1 && (
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
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white hover:bg-slate-100 transition-colors disabled:opacity-40 flex items-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Publication Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
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
                    <Newspaper className="w-5 h-5 text-cream" />
                  </div>
                  <h3 className="font-semibold text-white text-lg font-serif">
                    {editingPub ? 'Edit Publication' : 'Add Publication'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePublication} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Publication Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. The New York Times / Scientific American"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Publisher / Press
                  </label>
                  <input
                    type="text"
                    required
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="e.g. Dow Jones & Company"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Publication Type
                    </label>
                    <select
                      value={pubType}
                      onChange={(e) => setPubType(Number(e.target.value) as PublicationType)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    >
                      <option value={0}>Newspaper</option>
                      <option value={1}>Magazine</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                      Issue Release Date
                    </label>
                    <input
                      type="date"
                      required
                      value={publishedDate}
                      onChange={(e) => setPublishedDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                    Availability Status
                  </label>
                  <select
                    value={isAvailable ? 'true' : 'false'}
                    onChange={(e) => setIsAvailable(e.target.value === 'true')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  >
                    <option value="true">Available for Reading</option>
                    <option value="false">Archived / Unavailable</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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
                    {editingPub ? 'Update Publication' : 'Save Publication'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingPubId !== null}
        title="Delete Publication"
        message={`Are you sure you want to delete publication ID #${deletingPubId}?`}
        confirmText="Delete Publication"
        type="danger"
        isLoading={isSubmitting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingPubId(null)}
      />
    </div>
  );
};
