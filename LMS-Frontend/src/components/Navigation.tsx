import React from 'react';
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Clock,
  Users,
  UserCheck,
  Newspaper,
  BarChart3,
  LogIn,
  LogOut,
  Settings,
  User,
  ShieldCheck,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'books'
  | 'borrowRecords'
  | 'students'
  | 'librarians'
  | 'publications'
  | 'reports'
  | 'about'
  | 'contact';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: string | null;
  role: 'Admin' | 'Librarian' | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  role,
  onOpenLogin,
  onLogout,
  onOpenSettings,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'borrowRecords', label: 'Borrow Records', icon: Clock },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'librarians', label: 'Librarians', icon: UserCheck },
    { id: 'publications', label: 'Publications', icon: Newspaper },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <header className="bg-ocean text-white shadow-sm sticky top-0 z-40 border-b border-ocean/80">
      <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Name */}
          <button type="button" aria-label={role ? 'Go to dashboard' : 'Go to About'}
            onClick={() => setActiveTab(role ? 'dashboard' : 'about')}
            className="flex items-center gap-3 group text-left focus-visible:outline-2 focus-visible:outline-white rounded-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-classic-teal border border-persian/40 flex items-center justify-center shadow-sm transition-colors">
              <Library className="w-5 h-5 text-cream" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white font-serif block leading-tight sm:hidden">Granthalaya</span>
              <span className="text-lg font-bold tracking-tight text-white font-serif hidden leading-tight sm:block">Granthalaya</span>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden xl:flex items-center gap-1 xl:gap-2">
            {navItems.filter(item => role && (item.id !== 'librarians' || role === 'Admin')).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/15 text-white border border-white/20 font-semibold'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cream' : 'text-white/70'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              title="Connection Settings"
              aria-label="Connection and account settings"
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Auth / Login status */}
            {currentUser ? (
              <div className="flex items-center gap-2.5 bg-white/5 border border-white/20 rounded-xl px-3 py-1.5 shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-cream/20 text-cream flex items-center justify-center text-xs font-bold shrink-0 border border-cream/30">
                  <User className="w-4 h-4 text-cream" />
                </div>
                <div className="hidden sm:flex flex-col text-left max-w-[150px]">
                  <span className="text-xs font-semibold text-white truncate leading-snug">
                    {currentUser}
                  </span>
                  <span className="text-[10px] text-cream/80 flex items-center gap-1 font-sans">
                    <ShieldCheck className="w-3 h-3 text-cream inline" /> {role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 text-white/90 hover:text-white rounded-lg transition-colors text-xs font-medium ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-classic-teal hover:bg-persian text-white transition-all shadow-sm border border-mint/30 "
              >
                <LogIn className="w-4 h-4 text-cream" />
                <span>Staff Sign In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="xl:hidden flex items-center justify-start gap-1 py-2 overflow-x-auto no-scrollbar border-t border-white/10">
          {navItems.filter(item => role && (item.id !== 'librarians' || role === 'Admin')).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                  isActive
                    ? 'bg-classic-teal text-white font-semibold'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
