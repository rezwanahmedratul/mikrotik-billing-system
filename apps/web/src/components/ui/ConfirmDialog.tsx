'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex items-start gap-3 py-2">
        {isDestructive && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
        )}
        <div className="text-xs text-neutral-600 leading-relaxed dark:text-neutral-300">{message}</div>
      </div>

      <div className="mt-5 flex justify-end gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="rounded-xl border border-neutral-200/90 bg-white px-4 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={onConfirm}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition shadow-xs disabled:opacity-50 bg-neutral-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
