import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Server, Key, RefreshCw, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onAddToast }) => {
  const [apiUrl, setApiUrl] = useState(api.getBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [healthResult, setHealthResult] = useState<'success' | 'failed' | null>(null);
  const currentToken = api.getToken();

  const handleSaveUrl = async () => {
    setIsTesting(true);
    setHealthResult(null);
    api.setBaseUrl(apiUrl);
    const isOnline = await api.checkApiHealth();
    setIsTesting(false);

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

  const handleClearToken = () => {
    api.setToken(null);
    onAddToast('info', 'Logged Out', 'Bearer token removed from local storage');
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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
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
                onClick={onClose}
                className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Endpoint configuration */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Server className="w-4 h-4 text-classic-teal" />
                  Backend API Base URL
                </label>
                <div className="flex gap-2">
                  <input
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

              {/* JWT Bearer Token Inspector */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Key className="w-4 h-4 text-classic-teal" />
                    Active JWT Bearer Token
                  </label>
                  {currentToken && (
                    <button
                      type="button"
                      onClick={handleClearToken}
                      className="text-xs text-rose-600 hover:underline font-medium"
                    >
                      Clear Token
                    </button>
                  )}
                </div>
                {currentToken ? (
                  <div className="p-3 bg-ocean rounded-xl border border-ocean text-xs font-mono text-cream break-all leading-normal max-h-24 overflow-y-auto">
                    {currentToken}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    No Bearer token attached. Click Login in top bar to authenticate.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
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
