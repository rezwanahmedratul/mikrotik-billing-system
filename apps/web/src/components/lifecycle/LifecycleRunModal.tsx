'use client';

import React, { useState } from 'react';
import { Play, ShieldAlert, CheckCircle2, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { fetchApi } from '@/lib/api';
import { LifecycleCycleResult } from './lifecycle.types';

interface LifecycleRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: LifecycleCycleResult) => void;
}

export const LifecycleRunModal: React.FC<LifecycleRunModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isDryRun, setIsDryRun] = useState(true);
  const [gracePeriodDays, setGracePeriodDays] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [runResult, setRunResult] = useState<LifecycleCycleResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setErrorMessage('');
    setRunResult(null);

    const res = await fetchApi<LifecycleCycleResult>('/lifecycle/run-cycle', {
      method: 'POST',
      body: JSON.stringify({
        isDryRun,
        gracePeriodDays: Number(gracePeriodDays),
      }),
    });

    setIsRunning(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.data) {
      setRunResult(res.data);
      onSuccess(res.data);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Automated Service Lifecycle & Suspension Run"
      description="Execute scheduled suspensions for overdue subscribers, restore settled accounts, and dispatch due reminders."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Mode Selector */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
            Execution Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsDryRun(true)}
              className={`p-3.5 text-left rounded-xl border transition-all ${
                isDryRun
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                  : 'border-neutral-200/80 bg-white hover:bg-neutral-50 text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dry-Run Simulation</span>
              </div>
              <div className={`text-[11px] mt-1 ${isDryRun ? 'text-neutral-300' : 'text-neutral-500'}`}>
                Safe forecast. Makes NO changes to router or database.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsDryRun(false)}
              className={`p-3.5 text-left rounded-xl border transition-all ${
                !isDryRun
                  ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                  : 'border-neutral-200/80 bg-white hover:bg-neutral-50 text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold">
                <Play className="w-3.5 h-3.5" />
                <span>Live Execution</span>
              </div>
              <div className={`text-[11px] mt-1 ${!isDryRun ? 'text-neutral-300' : 'text-neutral-500'}`}>
                Disables PPPoE on router, sends SMS, and updates status.
              </div>
            </button>
          </div>
        </div>

        {/* Grace Period Input */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
            Grace Period (Days After Due Date)
          </label>
          <input
            type="number"
            min={0}
            max={30}
            value={gracePeriodDays}
            onChange={(e) => setGracePeriodDays(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-neutral-50/70 border border-neutral-200 rounded-xl text-sm font-mono text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
          />
          <div className="text-[11px] text-neutral-400 mt-1">
            Accounts with overdue invoices beyond {gracePeriodDays} days after due date will be suspended.
          </div>
        </div>

        {/* Results View if Run Completed */}
        {runResult && (
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Cycle Results ({runResult.isDryRun ? 'Simulation' : 'Live'})
              </span>
              <span className="text-[11px] font-mono text-neutral-500">
                {new Date(runResult.executionDate).toLocaleTimeString()}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 bg-white border border-neutral-200/80 rounded-lg text-center">
                <div className="text-[10px] text-neutral-400 uppercase font-semibold">Suspensions</div>
                <div className="text-lg font-bold font-mono text-neutral-900">
                  {runResult.subscriptionsSuspended}
                </div>
              </div>
              <div className="p-2.5 bg-white border border-neutral-200/80 rounded-lg text-center">
                <div className="text-[10px] text-neutral-400 uppercase font-semibold">Restorations</div>
                <div className="text-lg font-bold font-mono text-neutral-900">
                  {runResult.subscriptionsRestored}
                </div>
              </div>
              <div className="p-2.5 bg-white border border-neutral-200/80 rounded-lg text-center">
                <div className="text-[10px] text-neutral-400 uppercase font-semibold">Reminders</div>
                <div className="text-lg font-bold font-mono text-neutral-900">
                  {runResult.dueRemindersSent}
                </div>
              </div>
            </div>

            {runResult.actions.length > 0 && (
              <div className="max-h-48 overflow-y-auto divide-y divide-neutral-200/60 border border-neutral-200/80 rounded-lg bg-white">
                {runResult.actions.map((act, idx) => (
                  <div key={idx} className="p-2.5 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-neutral-900">{act.subscriberName}</span>
                      <span className="text-[11px] text-neutral-400 font-mono ml-2">({act.accountNumber})</span>
                      <div className="text-[11px] text-neutral-500 mt-0.5">{act.reason}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                        act.action === 'SUSPEND'
                          ? 'bg-neutral-900 text-white'
                          : act.action === 'RESTORE'
                          ? 'bg-neutral-100 text-neutral-900'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {act.action}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-medium rounded-xl hover:bg-neutral-50 transition-colors"
          >
            {runResult ? 'Close' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Executing Lifecycle Engine...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run {isDryRun ? 'Simulation' : 'Live Cycle'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
