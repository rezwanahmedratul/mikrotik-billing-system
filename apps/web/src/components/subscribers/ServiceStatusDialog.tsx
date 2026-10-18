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
          className={`p-3 rounded-lg border text-xs flex items-start gap-3 ${
            isSuspending
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          {isSuspending ? (
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="leading-relaxed">
            {isSuspending ? (
              <p>
                <strong>Immediate Cutoff Warning:</strong> Disabling PPPoE secret{' '}
                <code>{subscriber.pppoeAccount?.username}</code> on router{' '}
                <strong>{subscriber.pppoeAccount?.routerName || 'Gateway'}</strong> will drop any
                active PPPoE connection session immediately.
              </p>
            ) : (
              <p>
                The PPPoE secret for <code>{subscriber.pppoeAccount?.username}</code> will be
                enabled on router{' '}
                <strong>{subscriber.pppoeAccount?.routerName || 'Gateway'}</strong>. The subscriber
                can re-authenticate immediately.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
            Reason / Audit Note
          </label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={isSuspending ? 'e.g. Non-payment of bill' : 'e.g. Paid in full'}
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2 ${
              isSuspending
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            {isSuspending ? 'Confirm Suspension' : 'Confirm Restoration'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
