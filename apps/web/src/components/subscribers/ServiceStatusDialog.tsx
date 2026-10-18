'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { SubscriberItem } from './subscribers.types';

interface ServiceStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subscriber: SubscriberItem | null;
  targetAction: 'SUSPEND' | 'RESTORE';
  onConfirm: (reason: string) => Promise<void>;
  isLoading: boolean;
}

export function ServiceStatusDialog({
  isOpen,
  onClose,
  subscriber,
  targetAction,
  onConfirm,
  isLoading,
}: ServiceStatusDialogProps) {
  const [reason, setReason] = useState(
    targetAction === 'SUSPEND' ? 'Non-payment of monthly invoice' : 'Payment received'
  );

  if (!subscriber) return null;

  const isSuspending = targetAction === 'SUSPEND';

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(reason);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSuspending ? `Suspend Service: ${subscriber.fullName}` : `Restore Service: ${subscriber.fullName}`}
      description={
        isSuspending
          ? 'Suspend internet access for this subscriber and disable their PPPoE credentials on the router.'
          : 'Re-enable PPPoE credentials on the router gateway to restore high-speed internet access.'
      }
    >
      <form onSubmit={handleConfirm} className="space-y-4">
        <div
          className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900 text-white dark:border-neutral-800 dark:bg-black dark:text-neutral-200 text-xs flex items-start gap-3"
        >
          {isSuspending ? (
            <AlertTriangle className="w-5 h-5 text-white dark:text-neutral-300 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-white dark:text-neutral-300 flex-shrink-0 mt-0.5" />
          )}
          <div className="leading-relaxed">
            {isSuspending ? (
              <p>
                <strong className="text-white">Immediate Cutoff Warning:</strong> Disabling PPPoE secret{' '}
                <code className="font-mono bg-black dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-700">{subscriber.pppoeAccount?.username}</code> on router{' '}
                <strong>{subscriber.pppoeAccount?.routerName || 'Gateway'}</strong> will drop any
                active PPPoE connection session immediately.
              </p>
            ) : (
              <p>
                The PPPoE secret for <code className="font-mono bg-black dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-700">{subscriber.pppoeAccount?.username}</code> will be
                enabled on router{' '}
                <strong>{subscriber.pppoeAccount?.routerName || 'Gateway'}</strong>. The subscriber
                can re-authenticate immediately.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
            Reason / Audit Note
          </label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isSuspending ? 'e.g. Non-payment of bill' : 'e.g. Paid in full'}
            className="w-full px-3 py-2 bg-neutral-50 dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-white focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 text-white dark:text-black bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-200 text-xs font-semibold rounded-xl transition-colors shadow-xs disabled:opacity-60 flex items-center gap-2"
          >
            {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            {isSuspending ? 'Confirm Suspension' : 'Confirm Restoration'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
