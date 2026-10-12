import { useDialog } from '../useDialog';
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { Student, StudentListResponseDto } from '../../types/api';
import { ConfirmModal } from '../ConfirmModal';

interface StudentsViewProps {
  onAddToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  onRequestAuth?: (promptMessage?: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ onAddToast, onRequestAuth }) => {
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

  const [data, setData] = useState<StudentListResponseDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<number | null>(null);

  // Form states
  const [studentName, setStudentName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Female');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = async (query: string = searchTerm, page: number = currentPage) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await api.getStudents(query, page, 5);
      if (page > Math.max(1, res.totalPages)) { setCurrentPage(Math.max(1, res.totalPages)); return; }
      setData(res);
    } catch (err: any) {
      setLoadError(err.message);
      setData(null);
      onAddToast('error', 'Failed to fetch students', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(searchTerm, currentPage);
  }, [currentPage]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchStudents(searchTerm, 1);
  };

  const openAddModal = () => {
    if (!checkAuth()) return;
    setEditingStudent(null);
    setStudentName('');
    setRegistrationNumber('');
    setEmail('');
    setPhone('');
    setGender('Female');
    setAddress('');
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    if (!checkAuth()) return;
    setEditingStudent(student);
    setStudentName(student.studentName);
    setRegistrationNumber(student.registrationNumber);
    setEmail(student.email);
    setPhone(student.phone);
    setGender(student.gender || 'Other');
    setAddress(student.address || '');
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        studentName,
        registrationNumber,
        email,
        phone,
        gender,
        address,
      };

      if (editingStudent) {
        await api.updateStudent(editingStudent.studentId, payload);
        onAddToast('success', 'Student Updated', `${studentName}'s record updated.`);
      } else {
        await api.addStudent(payload);
        onAddToast('success', 'Student Registered', `${studentName} added to library directory.`);
      }

      setIsModalOpen(false);
      fetchStudents(searchTerm, currentPage);
    } catch (err: any) {
      onAddToast('error', 'Save Student Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudentId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.deleteStudent(deletingStudentId);
      onAddToast('success', 'Student Deleted', `Student #${deletingStudentId} removed.`);
      setDeletingStudentId(null);
      fetchStudents(searchTerm, currentPage);
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
          <h1 className="text-3xl font-extrabold font-serif text-ocean">Students Directory</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Registered student members and contact profiles
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-2.5 bg-classic-teal hover:bg-persian text-white font-medium text-sm rounded-2xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-cream" />
          <span>Register New Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-classic-teal/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              aria-label="Search students by name or registration number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name or registration number..."
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
          Showing <span className="font-semibold text-ocean">{data?.students.length || 0}</span> of{' '}
          <span className="font-semibold text-ocean">{data?.totalItems || 0}</span> students
        </div>
      </div>

      {/* Students Data Table */}
      {loadError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{loadError}</p>}
      <div className="bg-white rounded-3xl border border-classic-teal/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-ocean text-white uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">ID</th>
                <th className="py-4 px-6">Registration No.</th>
                <th className="py-4 px-6">Student Name</th>
                <th className="py-4 px-6">Contact Email</th>
                <th className="py-4 px-6">Phone</th>
                <th className="py-4 px-6">Gender</th>
                <th className="py-4 px-6">Campus Address</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-classic-teal border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium">Fetching students list...</span>
                    </div>
                  </td>
                </tr>
              ) : data?.students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No student records found matching your query.
                  </td>
                </tr>
              ) : (
                data?.students.map((student) => (
                  <tr key={student.studentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-mono text-xs text-slate-500 font-semibold">
                      #{student.studentId}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-700">{student.registrationNumber}</td>
                    <td className="py-4 px-6 font-semibold text-slate-900">{student.studentName}</td>
                    <td className="py-4 px-6 text-slate-600">{student.email}</td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-600">{student.phone}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-cream/80 text-ocean border border-cream">
                        {student.gender}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate">
                      {student.address}
                    </td>
                    <td className="py-4 px-6 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(student)}
                        className="px-2.5 py-1.5 bg-cream/80 text-ocean hover:bg-cream rounded-lg text-xs font-semibold transition-colors border border-cream"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (checkAuth()) setDeletingStudentId(student.studentId);
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

      {/* Add / Edit Student Modal */}
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
              ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Student record"
              className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between px-6 py-4 bg-ocean text-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-classic-teal rounded-xl">
                    <Users className="w-5 h-5 text-cream" />
                  </div>
                  <h3 className="font-semibold text-white text-lg font-serif">
                    {editingStudent ? 'Edit Student Record' : 'Register New Student'}
                  </h3>
                </div>
                <button
                  onClick={() => { if (!isSubmitting) setIsModalOpen(false); }}
                  className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1" htmlFor="studentsview-field-1">Registration Number</label>
                  <input id="studentsview-field-1" type="text" required aria-label="Registration number" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1" htmlFor="studentsview-field-2">
                    Student Full Name
                  </label>
                  <input id="studentsview-field-2"
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Aditi Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1" htmlFor="studentsview-field-3">
                      Email Address
                    </label>
                    <input id="studentsview-field-3"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="aditi@university.edu"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1" htmlFor="studentsview-field-4">
                      Phone Number
                    </label>
                    <input id="studentsview-field-4"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 555-0142"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1" htmlFor="studentsview-field-5">
                      Gender
                    </label>
                    <select id="studentsview-field-5"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-Binary">Non-Binary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1" htmlFor="studentsview-field-6">
                      Campus Address / Dorm
                    </label>
                    <input id="studentsview-field-6"
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Hall 4, Room 302"
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
                    {editingStudent ? 'Update Student' : 'Save Student'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deletingStudentId !== null}
        title="Delete Student Record"
        message={`Are you sure you want to delete student ID #${deletingStudentId}?`}
        confirmText="Delete Student"
        type="danger"
        isLoading={isSubmitting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingStudentId(null)}
      />
    </div>
  );
};
