import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Clock,
  ArrowRight,
  RefreshCw,
  Library,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../services/api';
import { DashboardMetricsDto, BorrowRecord } from '../../types/api';
import { ActiveTab } from '../Navigation';
import { isOverdue, localDate } from '../../services/dates';

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
      const m = await api.getDashboardMetrics();
      setMetrics(m);
      setRecentBorrows(m.recentActivity);
    } catch (err: any) {
      onAddToast('error', 'Dashboard Data Error', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const overview = [
    ['Book titles', metrics?.totalBooks, 'books'],
    ['Physical copies', metrics?.totalCopies, 'books'],
    ['Available copies', metrics?.availableCopies, 'books'],
    ['Borrowed copies', metrics?.borrowedCopies, 'borrowRecords'],
    ['Active loans', metrics?.activeLoans, 'borrowRecords'],
    ['Overdue loans', metrics?.overdueLoans, 'borrowRecords'],
    ['Returned loans', metrics?.returnedLoans, 'borrowRecords'],
    ['Students', metrics?.totalStudents, 'students'],
  ] as const;

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
            Manage physical book copies, registered students, publications, and borrowing history from one local workspace.
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
          <p className="text-xs text-slate-500">Current database status · use Refresh for updates</p>
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
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {overview.map(([label, value, tab]) => (
          <button key={label} type="button" onClick={() => onNavigate(tab)}
            className="bg-white p-5 rounded-2xl border border-classic-teal/20 shadow-sm hover:border-classic-teal text-left focus-visible:outline-2 focus-visible:outline-classic-teal">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">{label}</span>
            <span className="block text-3xl font-extrabold text-ocean mt-3">{isLoading ? '…' : value ?? '—'}</span>
          </button>
        ))}
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
            <p className="text-xs text-slate-500">Latest borrowings and their current status</p>
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
                    {isLoading ? 'Loading activity…' : 'No circulation activity yet.'}
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
                      {localDate(rec.borrowDate)}
                    </td>
                    <td className="py-4 px-6">
                      {rec.returnDate ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-mint/20 text-ocean border border-mint/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-mint"></span>
                          Returned
                        </span>
                      ) : isOverdue(rec) ? (
                        <span className="text-rose-700 font-semibold">Overdue</span>
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
