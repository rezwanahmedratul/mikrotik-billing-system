'use client';

import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { fetchApi } from '@/lib/api';

interface ManualOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionId?: string;
  subscriberName?: string;
  onSuccess: (msg: string) => void;
}

export const ManualOverrideModal: React.FC<ManualOverrideModalProps> = ({
  isOpen,
  onClose,
  subscriptionId = '',
  subscriberName = '',
  onSuccess,
}) => {
  const [subId, setSubId] = useState(subscriptionId);
  const [action, setAction] = useState<'EXTEND_GRACE' | 'SUSPEND' | 'RESTORE'>('EXTEND_GRACE');
  const [graceDays, setGraceDays] = useState(3);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subId.trim()) {
      setErrorMessage('Subscription ID is required.');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('Mandatory administrative reason is required for lifecycle override.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const res = await fetchApi<{ success: boolean; message: string }>('/lifecycle/override', {
      method: 'POST',
      body: JSON.stringify({
        subscriptionId: subId.trim(),
        action,
        reason: reason.trim(),
        graceDays: action === 'EXTEND_GRACE' ? Number(graceDays) : undefined,
      }),
    });

    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      onSuccess(res.data?.message || 'Manual override recorded.');
      setReason('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manual Service Lifecycle Override"
      description={`Administrative override for ${subscriberName ? `subscriber ${subscriberName}` : 'subscription service'}. All actions are strictly logged in the system audit trail.`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
            Subscription ID
          </label>
          <input
            type="text"
            value={subId}
            onChange={(e) => setSubId(e.target.value)}
            placeholder="Subscription UUID..."
            className="w-full px-3.5 py-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
            Override Action
          </label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as any)}
            className="w-full px-3.5 py-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
          >
            <option value="EXTEND_GRACE">Extend Grace Period (Delay Cutoff)</option>
            <option value="RESTORE">Force Restore Service (Unblock)</option>
            <option value="SUSPEND">Force Immediate Suspension (Cutoff)</option>
          </select>
        </div>

        {action === 'EXTEND_GRACE' && (
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Extension Days
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={graceDays}
              onChange={(e) => setGraceDays(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl text-sm font-mono text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
            Audit Reason (Mandatory)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Document why this manual override was authorized..."
            className="w-full p-3 bg-neutral-50/70 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-medium rounded-xl hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Recording Override...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Confirm Override</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
