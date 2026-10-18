import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { CheckCircle2, AlertCircle, Clock, Cpu, HardDrive } from 'lucide-react';
import { TestResult } from './routers.types';

interface RouterTestResultModalProps {
  result: TestResult | null;
  onClose: () => void;
}

export function RouterTestResultModal({ result, onClose }: RouterTestResultModalProps) {
  if (!result) return null;

  return (
    <Modal
      isOpen={!!result}
      onClose={onClose}
      title="Connection Diagnostic Report"
      description="Real-time socket probe and RouterOS system identity validation."
    >
      <div className="space-y-4">
        {result.success ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-xs text-white dark:border-white dark:bg-white dark:text-black">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-white dark:text-black" />
            <div>
              <span className="font-semibold block text-sm">Router Connection Successful</span>
              <span className="text-neutral-300 dark:text-neutral-700">Successfully established session and authenticated credentials.</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-xs text-white dark:border-neutral-700 dark:bg-black dark:text-white">
            <AlertCircle className="h-5 w-5 shrink-0 text-white dark:text-white" />
            <div>
              <span className="font-semibold block text-sm">Connection Failed</span>
              <span className="text-neutral-300 dark:text-neutral-400">{result.error || 'Failed to communicate with router gateway.'}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-black p-3">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">Roundtrip Latency</span>
            <span className="mt-1 font-mono text-base font-bold text-neutral-900 dark:text-white">{result.latencyMs} ms</span>
          </div>
          <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-black p-3">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">RouterOS Version</span>
            <span className="mt-1 font-mono text-base font-bold text-neutral-900 dark:text-white">{result.rosVersion || '—'}</span>
          </div>
          <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-black p-3">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">System Identity</span>
            <span className="mt-1 font-medium text-neutral-900 dark:text-white truncate block">{result.identity || '—'}</span>
          </div>
          <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-black p-3">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">Hardware Model</span>
            <span className="mt-1 font-mono text-neutral-900 dark:text-white truncate block">{result.boardName || '—'}</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-neutral-900 dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-black shadow-xs hover:bg-black dark:hover:bg-neutral-200 transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </Modal>
  );
}
