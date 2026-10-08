import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Users,
  UserCheck,
  Clock,
  Newspaper,
  ArrowRight,
  RefreshCw,
  Library,
  BookMarked,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { DashboardMetricsDto, BorrowRecord } from '../../types/api';
import { ActiveTab } from '../Navigation';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onAddToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onAddToast }) => {
  const [metrics, setMetrics] = useState<DashboardMetricsDto | null>(null);
  const [recentBorrows, setRecentBorrows] = useState<BorrowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [m, records] = await Promise.all([
        api.getDashboardMetrics(),
        api.getBorrowRecords(),
      ]);
      setMetrics(m);
      setRecentBorrows(records.slice(0, 5));
    } catch (err: any) {
      onAddToast('error', 'Dashboard Data Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-ocean text-white rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden border border-classic-teal/40"
      >
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Library className="w-96 h-96 text-white" />
        </div>

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-classic-teal border border-persian/40 text-cream text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Library Management Platform
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold font-serif tracking-tight text-white leading-tight">
            Library Management System
          </h1>

          <p className="text-slate-200 text-base sm:text-lg font-normal max-w-3xl leading-relaxed">
            Manage your library's complete catalog of books, student registrations, librarian assignments, newspaper & magazine publications, and borrow/return transaction records efficiently.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('books')}
              className="px-6 py-3 rounded-2xl bg-classic-teal hover:bg-persian text-white font-medium text-sm transition-all shadow-md flex items-center gap-2 group border border-persian/40"
            >
              <span>Explore Books Catalog</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-cream" />
            </button>
            <button
              onClick={() => onNavigate('borrowRecords')}
              className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-cream" />
              <span>Borrow Records</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Metrics Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ocean font-serif">System Overview Metrics</h2>
          <p className="text-xs text-slate-500">Real-time status indicators</p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="p-2 text-slate-500 hover:text-classic-teal rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Total Books */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => onNavigate('books')}
          className="bg-white p-5 rounded-2xl border border-classic-teal/20 shadow-sm hover:border-classic-teal/60 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Books
            </span>
            <div className="p-2.5 rounded-xl bg-mint/20 text-ocean group-hover:bg-classic-teal group-hover:text-white transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-ocean font-sans">
            {isLoading ? '...' : metrics?.totalBooks ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <BookMarked className="w-3.5 h-3.5 text-classic-teal" />
            Cataloged volumes
          </p>
        </motion.div>

        {/* Total Students */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => onNavigate('students')}
          className="bg-white p-5 rounded-2xl border border-classic-teal/20 shadow-sm hover:border-classic-teal/60 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Students
            </span>
            <div className="p-2.5 rounded-xl bg-mint/20 text-ocean group-hover:bg-classic-teal group-hover:text-white transition-colors">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-ocean font-sans">
            {isLoading ? '...' : metrics?.totalStudents ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-classic-teal" />
            Registered members
          </p>
        </motion.div>

        {/* Total Librarians */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => onNavigate('librarians')}
          className="bg-white p-5 rounded-2xl border border-classic-teal/20 shadow-sm hover:border-classic-teal/60 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Librarians
            </span>
            <div className="p-2.5 rounded-xl bg-cream text-ocean group-hover:bg-classic-teal group-hover:text-white transition-colors">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-ocean font-sans">
            {isLoading ? '...' : metrics?.totalLibrarians ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-classic-teal" />
            Staff roster
          </p>
        </motion.div>

        {/* Borrowings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => onNavigate('borrowRecords')}
          className="bg-white p-5 rounded-2xl border border-classic-teal/20 shadow-sm hover:border-classic-teal/60 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Loans
            </span>
            <div className="p-2.5 rounded-xl bg-cream text-ocean group-hover:bg-classic-teal group-hover:text-white transition-colors">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-ocean font-sans">
            {isLoading ? '...' : metrics?.totalBorrowings ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-classic-teal" />
            Active borrow records
          </p>
        </motion.div>

        {/* Publications */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => onNavigate('publications')}
          className="bg-white p-5 rounded-2xl border border-classic-teal/20 shadow-sm hover:border-classic-teal/60 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Publications
            </span>
            <div className="p-2.5 rounded-xl bg-mint/20 text-ocean group-hover:bg-classic-teal group-hover:text-white transition-colors">
              <Newspaper className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-ocean font-sans">
            {isLoading ? '...' : metrics?.totalPublications ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
            <Newspaper className="w-3.5 h-3.5 text-classic-teal" />
            Periodicals & serials
          </p>
        </motion.div>
      </div>

      {/* Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-classic-teal/20 shadow-sm flex flex-col justify-between hover:border-classic-teal transition-all">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-mint/20 text-ocean flex items-center justify-center">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-serif text-ocean">Books Catalog</h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Browse, search, edit, and add new books to the library collection. Monitor author metadata, publication dates, ISBNs, and loan status.
              </p>
            </div>
          </div>
          <div className="pt-6">
            <button
              onClick={() => onNavigate('books')}
              className="w-full py-3 px-5 rounded-xl bg-classic-teal hover:bg-persian text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Manage Books Collection</span>
              <ArrowRight className="w-4 h-4 text-cream" />
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-classic-teal/20 shadow-sm flex flex-col justify-between hover:border-classic-teal transition-all">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cream text-ocean flex items-center justify-center">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-bold font-serif text-ocean">Borrow & Return Transactions</h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Issue book loans to students, monitor active loan durations, record return timestamps, and maintain borrower records.
              </p>
            </div>
          </div>
          <div className="pt-6">
            <button
              onClick={() => onNavigate('borrowRecords')}
              className="w-full py-3 px-5 rounded-xl bg-classic-teal hover:bg-persian text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Manage Borrow Records</span>
              <ArrowRight className="w-4 h-4 text-cream" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-3xl border border-classic-teal/20 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-serif text-ocean">Recent Circulation Activity</h3>
            <p className="text-xs text-slate-500">Latest borrowing & return records</p>
          </div>
          <button
            onClick={() => onNavigate('borrowRecords')}
            className="text-xs font-semibold text-classic-teal hover:text-persian hover:underline"
          >
            View All Records &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-ocean text-white uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-6">Book Title</th>
                <th className="py-3.5 px-6">Borrower</th>
                <th className="py-3.5 px-6">Borrow Date</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBorrows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
                    No active circulation records found.
                  </td>
                </tr>
              ) : (
                recentBorrows.map((rec) => (
                  <tr key={rec.borrowRecordId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {rec.bookTitle} · {rec.accessionNumber}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-slate-800">{rec.studentName}</div>
                      <div className="text-xs text-slate-400">{rec.studentEmail}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">
                      {new Date(rec.borrowDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      {rec.returnDate ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-mint/20 text-ocean border border-mint/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-mint"></span>
                          Returned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cream text-ocean border border-cream">
                          <span className="w-1.5 h-1.5 rounded-full bg-classic-teal animate-pulse"></span>
                          Borrowed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
