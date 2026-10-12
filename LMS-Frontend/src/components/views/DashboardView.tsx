import { StatusBadge } from '../StatusBadge';
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Clock,
  ArrowRight,
  RefreshCw,
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
    <div className="space-y-6 pb-6">
      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="dashboard-intro border-l-4 border-l-classic-teal rounded-xl p-6 md:p-7 relative border border-slate-200"
      >
        <div className="relative max-w-4xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Granthalaya / Library workspace</p>

          <h1 className="text-3xl sm:text-4xl font-semibold font-serif tracking-tight text-ocean leading-tight">
            Your library, at a glance
          </h1>

          <p className="text-slate-600 text-sm sm:text-base font-normal max-w-3xl leading-relaxed">
            Manage physical book copies, registered students, publications, and borrowing history from one local workspace.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('books')}
              className="px-4 py-2.5 rounded-lg bg-classic-teal hover:bg-persian text-white font-medium text-sm transition-all shadow-sm flex items-center gap-2 group border border-persian/40"
            >
              <span>Explore Books Catalog</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-cream" />
            </button>
            <button
              onClick={() => onNavigate('borrowRecords')}
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium text-sm border border-slate-300 transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-classic-teal" />
              <span>Borrow Records</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Metrics Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ocean font-serif">Collection & circulation</h2>
          <p className="text-xs text-slate-500">Live inventory and loan totals</p>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 rounded-xl border border-slate-200 overflow-hidden">
        {overview.map(([label, value, tab]) => (
          <button key={label} type="button" onClick={() => onNavigate(tab)}
            className={`bg-white p-5 hover:bg-slate-50 text-left focus-visible:outline-2 focus-visible:outline-classic-teal focus-visible:-outline-offset-2 ${label === 'Overdue loans' && value ? 'text-rose-800' : 'text-ocean'}`}>
            <span className="text-xs font-medium text-slate-600">{label}</span>
            <span className="block text-3xl font-semibold mt-2 tabular-nums">{isLoading ? '…' : value ?? '—'}</span>
          </button>
        ))}
      </div>

      {/* Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 bg-white border border-slate-200 rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200">
        <div className="p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-mint/20 text-ocean flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ocean">Books Catalog</h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Browse, search, edit, and add new books to the library collection. Monitor author metadata, publication dates, ISBNs, and loan status.
              </p>
            </div>
          </div>
          <div className="pt-4">
            <button
              onClick={() => onNavigate('books')}
              className="py-2 px-4 rounded-xl bg-classic-teal hover:bg-persian text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Manage Books Collection</span>
              <ArrowRight className="w-4 h-4 text-cream" />
            </button>
          </div>
        </div>

        <div className="p-5 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cream text-ocean flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ocean">Borrow & Return Transactions</h3>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Issue book loans to students, monitor active loan durations, record return timestamps, and maintain borrower records.
              </p>
            </div>
          </div>
          <div className="pt-4">
            <button
              onClick={() => onNavigate('borrowRecords')}
              className="py-2 px-4 rounded-xl bg-classic-teal hover:bg-persian text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Manage Borrow Records</span>
              <ArrowRight className="w-4 h-4 text-cream" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ocean">Recent Circulation Activity</h3>
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
            <thead className="bg-slate-100 text-slate-600 text-xs tracking-wide font-semibold">
              <tr>
                <th className="py-3.5 px-4 xl:px-6">Book Title</th>
                <th className="py-3.5 px-4 xl:px-6">Borrower</th>
                <th className="py-3.5 px-4 xl:px-6">Borrow Date</th>
                <th className="py-3.5 px-4 xl:px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentBorrows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">
                    {isLoading ? 'Loading activity…' : 'No circulation activity yet.'}
                  </td>
                </tr>
              ) : (
                recentBorrows.map((rec) => (
                  <tr key={rec.borrowRecordId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 xl:px-6 font-semibold text-slate-900">
                      {rec.bookTitle} · {rec.accessionNumber}
                    </td>
                    <td className="py-4 px-4 xl:px-6">
                      <div className="font-medium text-slate-800">{rec.studentName}</div>
                      <div className="text-xs text-slate-500">{rec.studentEmail}</div>
                    </td>
                    <td className="py-4 px-4 xl:px-6 font-mono text-xs">
                      {localDate(rec.borrowDate)}
                    </td>
                    <td className="py-4 px-4 xl:px-6">
                      {rec.returnDate ? (
                        <StatusBadge tone="success">Returned</StatusBadge>
                      ) : isOverdue(rec) ? (
                        <StatusBadge tone="danger">Overdue</StatusBadge>
                      ) : (
                        <StatusBadge tone="warning">Borrowed</StatusBadge>
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
