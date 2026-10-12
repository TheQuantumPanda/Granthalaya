import React from 'react';
import { useDialog } from './useDialog';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useDialog(isOpen, onCancel, isLoading);
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!isLoading) onCancel(); }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            ref={dialogRef} tabIndex={-1}
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-xl ${
                    type === 'danger'
                      ? 'bg-rose-100 text-rose-600'
                      : type === 'warning'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-cream text-ocean'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-ocean text-lg font-serif">{title}</h3>
              </div>
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                aria-label="Close confirmation"
                className="text-slate-500 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                  <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
              <button
                data-initial-focus
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition-colors shadow-sm flex items-center gap-2 ${
                  type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-classic-teal hover:bg-persian'
                } disabled:opacity-50`}
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
