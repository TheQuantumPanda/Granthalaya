import { useDialog } from './useDialog';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Server, RefreshCw, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { api } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionEnded: () => void;
  onAddToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSessionEnded, onAddToast }) => {
  const [apiUrl, setApiUrl] = useState(api.getBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [healthResult, setHealthResult] = useState<'success' | 'failed' | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);

  const handleSaveUrl = async () => {
    setIsTesting(true);
    setHealthResult(null);
    let isOnline = false;
    try { api.setBaseUrl(apiUrl); isOnline = await api.checkApiHealth(); }
    catch (error) {
      onAddToast('error', 'Invalid API URL', error instanceof Error ? error.message : 'Use a local API URL.');
      return;
    } finally { setIsTesting(false); }

    if (isOnline) {
      setHealthResult('success');
      onAddToast('success', 'Connected to API', `Successfully connected to REST API at ${apiUrl}`);
    } else {
      setHealthResult('failed');
      onAddToast(
        'info',
        'Backend Connection Checked',
        `Attempted connection to ${apiUrl}.`
      );
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault(); if (passwordBusy) return; setPasswordBusy(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      api.setToken(null);
      setCurrentPassword(''); setNewPassword('');
      onSessionEnded(); onClose();
      onAddToast('success', 'Password changed', 'Sign in with the new password.');
    } catch (error) { onAddToast('error', 'Password change failed', error instanceof Error ? error.message : 'Failed'); }
    finally { setPasswordBusy(false); }
  };

  const dialogRef = useDialog(isOpen, onClose, isTesting || passwordBusy);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!(isTesting || passwordBusy)) onClose(); }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Connection and account settings"
              className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="flex items-center justify-between px-6 py-4 bg-ocean text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-classic-teal rounded-xl">
                  <Settings className="w-5 h-5 text-cream" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg font-serif">REST API & Auth Settings</h3>
                  <p className="text-xs text-cream/90">ASP.NET Core Backend Connection</p>
                </div>
              </div>
              <button
                onClick={() => { if (!(isTesting || passwordBusy)) onClose(); }}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Endpoint configuration */}
              <div className="space-y-2">
                <label htmlFor="api-base-url" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Server className="w-4 h-4 text-classic-teal" />
                  Backend API Base URL
                </label>
                <div className="flex gap-2">
                  <input
                    id="api-base-url"
                    type="text"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://localhost:5199"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-classic-teal/20 focus:border-classic-teal"
                  />
                  <button
                    type="button"
                    onClick={handleSaveUrl}
                    disabled={isTesting}
                    className="px-4 py-2.5 bg-classic-teal hover:bg-persian text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shrink-0 shadow-sm"
                  >
                    {isTesting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-cream" />
                    )}
                    Test & Save
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Target REST API server address specified in Swagger specification.
                </p>
              </div>

              {/* Connection Status Banner */}
              {healthResult && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    healthResult === 'success'
                      ? 'bg-mint/20 border-mint/40 text-ocean'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  {healthResult === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-mint shrink-0 mt-0.5 font-bold" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-1">
                    <span className="font-semibold block text-sm">
                      {healthResult === 'success'
                        ? 'Connected to REST API'
                        : 'Connection Issue'}
                    </span>
                    <p className="opacity-90 leading-relaxed">
                      {healthResult === 'success'
                        ? `Requests are routed live to ${apiUrl}/api/...`
                        : `Could not reach ${apiUrl}. Please verify backend server is running.`}
                    </p>
                  </div>
                </div>
              )}

              {api.getToken() && <form onSubmit={changePassword} className="border-t border-slate-100 pt-4 space-y-2">
                <h4 className="font-semibold text-ocean">Change password</h4>
                <input required aria-label="Current password" type="password" autoComplete="current-password" placeholder="Current password" value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm" />
                <input required aria-label="New password" type="password" minLength={12} autoComplete="new-password" placeholder="New password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm" />
                <button type="submit" disabled={passwordBusy} className="bg-classic-teal text-white rounded-xl px-4 py-2 text-sm disabled:opacity-50">Update password</button>
              </form>}
            </div>

            <div className="flex justify-end px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { if (!(isTesting || passwordBusy)) onClose(); }}
                className="px-5 py-2.5 rounded-xl bg-classic-teal hover:bg-persian text-white font-medium text-sm transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
