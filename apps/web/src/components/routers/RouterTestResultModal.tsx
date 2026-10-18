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
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs text-emerald-800">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <div>
              <span className="font-semibold block text-sm">Router Connection Successful</span>
              <span>Successfully established session and authenticated credentials.</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/60 p-4 text-xs text-rose-800">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <span className="font-semibold block text-sm">Connection Failed</span>
              <span>{result.error || 'Failed to communicate with router gateway.'}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">Roundtrip Latency</span>
            <span className="mt-1 font-mono text-base font-bold text-neutral-900">{result.latencyMs} ms</span>
          </div>
          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">RouterOS Version</span>
            <span className="mt-1 font-mono text-base font-bold text-neutral-900">{result.rosVersion || '—'}</span>
          </div>
          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">System Identity</span>
            <span className="mt-1 font-medium text-neutral-900 truncate block">{result.identity || '—'}</span>
          </div>
          <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3">
            <span className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block">Hardware Model</span>
            <span className="mt-1 font-mono text-neutral-900 truncate block">{result.boardName || '—'}</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </Modal>
  );
}
