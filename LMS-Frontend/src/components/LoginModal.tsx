import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogIn,
  UserPlus,
  User,
  Lock,
  X,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Info,
  InfoIcon,
} from 'lucide-react';
import { api } from '../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
  onAddToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  promptMessage?: string;
  initialTab?: 'login' | 'register';
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onAddToast,
  promptMessage,
  initialTab = 'login',
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, initialTab]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.login({ email: loginEmail, password: loginPassword });
      if (res.accessToken) {
        onAddToast(
          'success',
          'Welcome Back!',
          `Logged in successfully as ${loginEmail}. Bearer token attached.`
        );
        onSuccess(loginEmail);
        onClose();
      } else {
        throw new Error('No access token returned from authentication endpoint.');
      }
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Invalid email or password. Please verify credentials and backend status.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      await api.register({ email: regEmail, password: regPassword });
      onAddToast('success', 'Account Created!', `Account for ${regEmail} created successfully.`);

      // Attempt automatic login
      try {
        const loginRes = await api.login({ email: regEmail, password: regPassword });
        if (loginRes.accessToken) {
          onAddToast('success', 'Logged In', 'Automatically authenticated with your new account.');
          onSuccess(regEmail);
          onClose();
          return;
        }
      } catch {
        // Auto-login optional fallback
      }

      setSuccessMsg('Account created successfully! Please sign in with your credentials.');
      setLoginEmail(regEmail);
      setLoginPassword('');
      setActiveTab('login');
    } catch (err: any) {
      setErrorMsg(
        err.message || 'Failed to create account. User may already exist or password requirements not met.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-ocean text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-classic-teal rounded-xl shadow-inner">
                  {activeTab === 'login' ? (
                    <LogIn className="w-5 h-5 text-cream" />
                  ) : (
                    <UserPlus className="w-5 h-5 text-cream" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg font-serif leading-tight">
                    Library Authentication
                  </h3>
                  <p className="text-xs text-cream/90 font-sans">
                    ASP.NET Core Identity & JWT Portal
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Prompt Banner if triggered by protected action */}
            {promptMessage && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-2.5 text-amber-900 text-xs">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="font-medium">{promptMessage}</span>
              </div>
            )}

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'login'
                    ? 'bg-white text-ocean shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`}
              >
                <LogIn className="w-3.5 h-3.5 text-classic-teal" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'register'
                    ? 'bg-white text-ocean shadow-sm border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-classic-teal" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Notification messages */}
            <div className="px-6 pt-4 space-y-2">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-mint/20 border border-mint/40 text-ocean rounded-xl text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-mint shrink-0 mt-0.5 font-bold" />
                  <span className="leading-relaxed font-medium">{successMsg}</span>
                </div>
              )}
            </div>

            {/* TAB 1: SIGN IN */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="p-6 pt-2 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.org"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    />
                  </div>
                </div>

                <div className="p-3 bg-cream/40 rounded-xl border border-cream text-xs text-ocean flex items-start gap-2">
                  <KeyRound className="w-4 h-4 text-classic-teal shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    Sends credentials to ASP.NET Core endpoint and attaches Bearer token to all requests.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-classic-teal hover:bg-persian text-white transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoading && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Sign In
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: CREATE ACCOUNT */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="p-6 pt-2 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Email Address
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="librarian@library.org"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Choose a password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                    />
                  </div>
                </div>

                {/* Password requirement hint badge */}
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-classic-teal shrink-0 mt-0.5" />
                  <span className="leading-normal">
                    Password must contain 6+ characters, an uppercase letter, a digit, and a special character.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium bg-classic-teal hover:bg-persian text-white transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isLoading && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Register Account
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
