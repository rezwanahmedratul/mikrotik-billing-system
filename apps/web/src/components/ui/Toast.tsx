'use client';

import React, { createContext, useContext, useState, useCallback, useId } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  durationMs?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (options: ToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, type = 'info', durationMs = 4000 }: ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, title, description, type, durationMs };
      setToasts((prev) => [...prev, newToast]);

      if (durationMs > 0) {
        setTimeout(() => {
          dismiss(id);
        }, durationMs);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 p-2 sm:p-0"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role={item.type === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-neutral-200/90 bg-white/95 p-4 shadow-xl backdrop-blur-sm transition-all dark:border-neutral-800 dark:bg-black/95"
          >
            <div className="mt-0.5 shrink-0">
              {item.type === 'success' && (
                <CheckCircle2 className="h-4 w-4 text-neutral-900 dark:text-white" />
              )}
              {item.type === 'error' && (
                <AlertCircle className="h-4 w-4 text-neutral-900 dark:text-white" />
              )}
              {item.type === 'warning' && (
                <AlertTriangle className="h-4 w-4 text-neutral-900 dark:text-white" />
              )}
              {item.type === 'info' && (
                <Info className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-neutral-900 dark:text-white">{item.title}</div>
              {item.description && (
                <div className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">{item.description}</div>
              )}
            </div>
            <button
              onClick={() => dismiss(item.id)}
              className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none dark:hover:bg-neutral-900 dark:hover:text-white"
              aria-label="Close notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
