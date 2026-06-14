import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmationModalProps) {
  const variantStyles = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
    info: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
  };

  const iconStyles = {
    danger: 'text-rose-600 bg-rose-50',
    warning: 'text-amber-500 bg-amber-50',
    info: 'text-indigo-600 bg-indigo-50'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className={`p-4 rounded-2xl mb-6 ${iconStyles[variant]}`}>
                <AlertTriangle size={32} />
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">
                {title}
              </h3>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                {message}
              </p>

              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-6 py-3 font-bold rounded-2xl transition-all shadow-lg active:scale-95 ${variantStyles[variant]}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
