import { useDialog } from './useDialog';
import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LogIn, X } from 'lucide-react';
import { api } from '../services/api';
import { StaffProfile } from '../types/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (profile: StaffProfile) => void;
  onAddToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
  promptMessage?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess, onAddToast, promptMessage }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (isOpen) { setError(''); setPassword(''); } }, [isOpen]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (loading) return; setLoading(true); setError('');
    try {
      const profile = await api.login({ email, password });
      onSuccess(profile);
      onAddToast('success', 'Signed In', `Signed in as ${profile.email}.`);
      onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Sign in failed.'); }
    finally { setLoading(false); setPassword(''); }
  };

  const dialogRef = useDialog(isOpen, onClose, loading);

  return <AnimatePresence>{isOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm" onClick={() => { if (!(loading)) onClose(); }} />
    <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .95 }}
      ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Staff Sign In"
              className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
      <div className="flex items-center justify-between px-6 py-4 bg-ocean text-white">
        <h3 className="font-semibold text-lg font-serif flex items-center gap-2"><LogIn className="w-5 h-5" /> Staff Sign In</h3>
        <button type="button" onClick={() => { if (!loading) onClose(); }} aria-label="Close" className="p-1.5 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
      </div>
      <form onSubmit={submit} className="p-6 space-y-4">
        {promptMessage && <p className="text-sm text-amber-800 bg-amber-50 p-3 rounded-xl">{promptMessage}</p>}
        {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 p-3 rounded-xl">{error}</p>}
        <label className="block text-sm font-medium text-slate-700">Email
          <input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200" /></label>
        <label className="block text-sm font-medium text-slate-700">Password
          <input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
            className="mt-1 w-full px-3 py-2.5 rounded-xl border border-slate-200" /></label>
        <button disabled={loading} type="submit" className="w-full px-5 py-2.5 bg-classic-teal text-white rounded-xl disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign In'}</button>
      </form>
    </motion.div>
  </div>}</AnimatePresence>;
};
