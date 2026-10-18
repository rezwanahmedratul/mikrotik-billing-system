'use client';

import React, { useState } from 'react';
import { AlertTriangle, Radio, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { SessionItem } from './sessions.types';

interface DisconnectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  session: SessionItem | null;
  onConfirm: (reason: string) => Promise<void>;
  isLoading: boolean;
}

export function DisconnectDialog({
  isOpen,
  onClose,
  session,
  onConfirm,
  isLoading,
}: DisconnectDialogProps) {
  const [reason, setReason] = useState('Manual operator disconnect');

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(reason);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Disconnect PPPoE Session: ${session.username}`}
      description="Immediately terminate this client's active network connection on the MikroTik router."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Session details card */}
        <div className="bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-200/60 dark:border-neutral-800">
            <span className="text-neutral-500 dark:text-neutral-400 font-medium">Router Gateway</span>
            <span className="font-mono font-semibold text-neutral-900 dark:text-white">{session.routerName}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-neutral-400 block mb-0.5">Assigned IP</span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200">{session.ipAddress || '—'}</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-0.5">Session Uptime</span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200">{session.uptime}</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-0.5">Upload (Rx)</span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200">{session.formattedRx}</span>
            </div>
            <div>
              <span className="text-neutral-400 block mb-0.5">Download (Tx)</span>
              <span className="font-mono text-neutral-800 dark:text-neutral-200">{session.formattedTx}</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 flex items-start gap-2.5 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-neutral-900 dark:text-white flex-shrink-0 mt-0.5" />
          <span>
            Terminating this session will drop the user&apos;s active PPPoE interface immediately.
            If the client has auto-redial enabled and their credentials remain valid, their CPE router will reconnect.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1">
            Reason / Audit Log Note
          </label>
          <input
            type="text"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Traffic throttling reset or operator maintenance"
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 text-xs font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Terminate Session
          </button>
        </div>
      </form>
    </Modal>
  );
}
