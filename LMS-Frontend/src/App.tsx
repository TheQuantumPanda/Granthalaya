import React, { useState, useEffect } from 'react';
import { Navigation, ActiveTab } from './components/Navigation';
import { ToastContainer } from './components/Toast';
import { LoginModal } from './components/LoginModal';
import { SettingsModal } from './components/SettingsModal';
import { DashboardView } from './components/views/DashboardView';
import { BooksView } from './components/views/BooksView';
import { BorrowRecordsView } from './components/views/BorrowRecordsView';
import { StudentsView } from './components/views/StudentsView';
import { LibrariansView } from './components/views/LibrariansView';
import { PublicationsView } from './components/views/PublicationsView';
import { ReportsView } from './components/views/ReportsView';
import { AboutView } from './components/views/AboutView';
import { ContactView } from './components/views/ContactView';
import { ToastMessage, Book } from './types/api';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | undefined>(undefined);
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preSelectedBookForBorrow, setPreSelectedBookForBorrow] = useState<Book | null>(null);

  // API Status
  const [apiUrl, setApiUrl] = useState(api.getBaseUrl());

  useEffect(() => {
    // Listen to API status changes
    const cleanup = api.onStatusChange((status) => {
      setApiUrl(status.url);
    });

    // Check backend health on initial startup
    api.checkApiHealth();

    // Check if token exists on load
    const token = api.getToken();
    if (token) {
      const email = api.getUserEmail() || 'admin@library.org';
      setCurrentUser(email);
    }

    // Interceptor callback for 401 Unauthorized status
    api.setOnUnauthorized(() => {
      setCurrentUser(null);
      addToast('error', 'Session Expired', 'Your session has expired or authentication token is invalid.');
      handleRequestAuth('Session expired. Please log in again to continue.', 'login');
    });

    return () => cleanup();
  }, []);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const newToast: ToastMessage = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev.slice(-4), newToast]);

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenLoginModal = (initialTab: 'login' | 'register' = 'login') => {
    setAuthPromptMessage(undefined);
    setAuthInitialTab(initialTab);
    setIsLoginOpen(true);
  };

  const handleRequestAuth = (
    promptMessage = 'Please log in to complete this action.',
    initialTab: 'login' | 'register' = 'login'
  ) => {
    setAuthPromptMessage(promptMessage);
    setAuthInitialTab(initialTab);
    setIsLoginOpen(true);
  };

  const handleLogout = () => {
    api.setToken(null);
    setCurrentUser(null);
    addToast('info', 'Logged Out', 'Successfully logged out.');
  };

  const handleLoginSuccess = (email: string) => {
    setCurrentUser(email);
  };

  const handleIssueBorrowForBook = (book: Book) => {
    setPreSelectedBookForBorrow(book);
    setActiveTab('borrowRecords');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-classic-teal selection:text-white">
      {/* Top Header Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenLogin={() => handleOpenLoginModal('login')}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-6 md:px-12 lg:px-16 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView onNavigate={setActiveTab} onAddToast={addToast} />
        )}
        {activeTab === 'books' && (
          <BooksView
            onAddToast={addToast}
            onIssueBorrowForBook={handleIssueBorrowForBook}
            onRequestAuth={handleRequestAuth}
          />
        )}
        {activeTab === 'borrowRecords' && (
          <BorrowRecordsView
            onAddToast={addToast}
            preSelectedBookForBorrow={preSelectedBookForBorrow}
            onClearPreSelectedBook={() => setPreSelectedBookForBorrow(null)}
            onRequestAuth={handleRequestAuth}
          />
        )}
        {activeTab === 'students' && (
          <StudentsView onAddToast={addToast} onRequestAuth={handleRequestAuth} />
        )}
        {activeTab === 'librarians' && (
          <LibrariansView onAddToast={addToast} onRequestAuth={handleRequestAuth} />
        )}
        {activeTab === 'publications' && (
          <PublicationsView onAddToast={addToast} onRequestAuth={handleRequestAuth} />
        )}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'about' && <AboutView />}
        {activeTab === 'contact' && <ContactView onAddToast={addToast} />}
      </main>

      {/* Footer */}
      <footer className="bg-ocean text-white/80 border-t border-ocean/80 py-6 text-center text-xs">
        <div className="w-full max-w-[1920px] mx-auto px-6 md:px-12 lg:px-16 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Library Management System. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <button onClick={() => setActiveTab('about')} className="hover:text-white font-medium">
              About Us
            </button>
            <button onClick={() => setActiveTab('contact')} className="hover:text-white font-medium">
              Contact Us
            </button>
            <button onClick={() => setActiveTab('reports')} className="hover:text-white font-medium">
              Analytics & Reports
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="hover:text-white font-medium">
              API Connection ({apiUrl})
            </button>
          </div>
        </div>
      </footer>

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
        onAddToast={addToast}
        promptMessage={authPromptMessage}
        initialTab={authInitialTab}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onAddToast={addToast}
      />
    </div>
  );
}
