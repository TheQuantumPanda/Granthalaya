import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Clock,
  PieChart,
  Users,
  ShieldCheck,
  Newspaper,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';
import { DashboardMetricsDto } from '../../types/api';

export const ReportsView: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetricsDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReportsData = async () => {
    setIsLoading(true);
    setError('');
    try {
      setMetrics(await api.getDashboardMetrics());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reports could not be loaded.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, []);

  // Compute calculated statistics
  const totalBorrows = metrics?.totalBorrowings ?? 0;
  const returnedBorrows = metrics?.returnedLoans ?? 0;
  const activeLoans = metrics?.activeLoans ?? 0;
  const returnRatePercent = totalBorrows > 0 ? Math.round((returnedBorrows / totalBorrows) * 100) : 0;

  const totalCopies = metrics?.totalCopies ?? 0;
  const availableBooksCount = metrics?.availableCopies ?? 0;
  const bookAvailabilityPercent =
    totalCopies > 0 ? Math.round((availableBooksCount / totalCopies) * 100) : 0;

  // Genre breakdown
  const genreCounts: Record<string, number> = metrics?.genreTitleCounts ?? {};

  return (
    <div className="space-y-8 pb-12">
      {/* View Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-serif text-ocean">Library Analytics & Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Database metrics, circulation performance, and catalog distribution summary
          </p>
        </div>
        <button
          onClick={loadReportsData}
          disabled={isLoading}
          className="px-4 py-2 bg-classic-teal hover:bg-persian text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800">{error}</p>}

      {/* Primary Circulation Callout Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Availability Gauge Card */}
        <div className="bg-white p-6 rounded-3xl border border-classic-teal/20 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-classic-teal">
                Catalog Availability
              </span>
              <div className="p-2 bg-mint/20 text-ocean rounded-xl">
                <BookOpen className="w-5 h-5 text-ocean" />
              </div>
            </div>
            <div className="text-3xl font-black text-ocean mt-1">{bookAvailabilityPercent}%</div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-ocean">{availableBooksCount}</span> of {totalCopies} physical copies available for immediate checkout
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 mt-6 overflow-hidden">
            <div
              className="bg-classic-teal h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${bookAvailabilityPercent}%` }}
            />
          </div>
        </div>

        {/* Loan Return Rate Card */}
        <div className="bg-white p-6 rounded-3xl border border-classic-teal/20 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-classic-teal">
                Loan Clearance Rate
              </span>
              <div className="p-2 bg-cream rounded-xl text-ocean">
                <CheckCircle2 className="w-5 h-5 text-ocean" />
              </div>
            </div>
            <div className="text-3xl font-black text-ocean mt-1">{returnRatePercent}%</div>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-semibold text-ocean">{returnedBorrows}</span> out of {totalBorrows} total borrow records returned
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 mt-6 overflow-hidden">
            <div
              className="bg-mint h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${returnRatePercent}%` }}
            />
          </div>
        </div>

        {/* Active Loans Card */}
        <div className="bg-white p-6 rounded-3xl border border-classic-teal/20 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-classic-teal">
                Active Circulation
              </span>
              <div className="p-2 bg-cream text-ocean rounded-xl">
                <Clock className="w-5 h-5 text-ocean" />
              </div>
            </div>
            <div className="text-3xl font-black text-ocean mt-1">{activeLoans} Loans</div>
            <p className="text-xs text-slate-500 mt-1">
              Books currently checked out by active library student members
            </p>
          </div>
          <div className="mt-6 flex items-center justify-between text-xs text-slate-600 bg-cream/60 px-3 py-2 rounded-xl border border-cream">
            <span className="font-medium text-ocean">Registered Members</span>
            <span className="font-bold text-ocean">{metrics?.totalStudents || 0} Students</span>
          </div>
        </div>
      </div>

      {/* Visual Breakdowns Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Book Genre Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-classic-teal/20 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-classic-teal" />
              <h3 className="text-lg font-bold font-serif text-ocean">Genre & Collection Distribution</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Catalog breakdown</span>
          </div>

          <div className="space-y-4">
            {Object.keys(genreCounts).length === 0 ? (
              <p className="text-xs text-slate-500">{isLoading ? 'Loading catalog items…' : 'No catalog items yet.'}</p>
            ) : (
              Object.entries(genreCounts).map(([genre, count]) => {
                const percentage = Math.round((count / (metrics?.totalBooks || 1)) * 100) || 0;
                return (
                  <div key={genre} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">{genre}</span>
                      <span className="text-ocean">{count} books ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-classic-teal h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Member Roster & Staff Summary */}
        <div className="bg-white p-6 rounded-3xl border border-classic-teal/20 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-classic-teal" />
              <h3 className="text-lg font-bold font-serif text-ocean">Directory & Staff Overview</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Live Roster</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase">Student Members</span>
                <Users className="w-4 h-4 text-classic-teal" />
              </div>
              <p className="text-2xl font-black text-ocean">{metrics?.totalStudents || 0}</p>
              <p className="text-[11px] text-slate-500">Active registered cardholders</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase">Librarian Staff</span>
                <ShieldCheck className="w-4 h-4 text-classic-teal" />
              </div>
              <p className="text-2xl font-black text-ocean">{metrics?.totalLibrarians || 0}</p>
              <p className="text-[11px] text-slate-500">Librarian directory entries</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase">Publications</span>
                <Newspaper className="w-4 h-4 text-classic-teal" />
              </div>
              <p className="text-2xl font-black text-ocean">{metrics?.totalPublications || 0}</p>
              <p className="text-[11px] text-slate-500">Newspaper & magazine serials</p>
            </div>

            <div className="bg-cream/60 p-4 rounded-2xl border border-cream space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ocean uppercase">Loan Turnover</span>
                <TrendingUp className="w-4 h-4 text-ocean" />
              </div>
              <p className="text-2xl font-black text-ocean">{totalBorrows}</p>
              <p className="text-[11px] text-ocean/80">Total circulation activity log</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
