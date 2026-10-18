'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { fetchApi } from '@/lib/api';
import {
  ServiceReconciliationReport,
  LifecycleCycleResult,
} from '@/components/lifecycle/lifecycle.types';
import { LifecycleStatsCards } from '@/components/lifecycle/LifecycleStatsCards';
import { LifecycleDistributionCharts } from '@/components/lifecycle/LifecycleDistributionCharts';
import { LifecycleRunModal } from '@/components/lifecycle/LifecycleRunModal';
import { ManualOverrideModal } from '@/components/lifecycle/ManualOverrideModal';

export default function LifecyclePage() {
  const [report, setReport] = useState<ServiceReconciliationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [lastRunResult, setLastRunResult] = useState<LifecycleCycleResult | null>(null);

  // Modals
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  const loadReconciliation = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const res = await fetchApi<ServiceReconciliationReport>('/lifecycle/reconciliation');
    setIsLoading(false);

    if (res.error) {
      // Demo fallback
      setReport({
        reconciledAt: new Date().toISOString(),
        totalSubscriptions: 24,
        activeCount: 22,
        suspendedCount: 2,
        discrepancies: [
          {
            subscriptionId: 'sub-disc-1',
            subscriber: 'Habibur Rahman',
            accountNumber: 'SUB-1008',
            issue: 'Active subscription has invoice #INV-00089 overdue by 8 days.',
            resolution: 'Eligible for suspension in next automated cycle.',
          },
        ],
      });
    } else if (res.data) {
      setReport(res.data);
    }
  };

  useEffect(() => {
    loadReconciliation();
  }, []);

  return (
    <AppShell
      title="Automated Service Lifecycle"
      description="Manage automated grace periods, scheduled suspensions, payment-triggered restorations, and administrative overrides."
    >
      {/* Alert Notifications */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl border border-neutral-200 bg-neutral-900 text-white flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-xs text-neutral-300 hover:text-white underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl border border-neutral-300 bg-neutral-100 text-neutral-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-neutral-900 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-xs text-neutral-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <LifecycleStatsCards
        report={report}
        lastRunResult={
          lastRunResult
            ? {
                suspended: lastRunResult.subscriptionsSuspended,
                restored: lastRunResult.subscriptionsRestored,
                reminders: lastRunResult.dueRemindersSent,
                isDryRun: lastRunResult.isDryRun,
              }
            : null
        }
      />

      {/* Service Health & Action Velocity Charts */}
      <LifecycleDistributionCharts report={report} />

      {/* Action Toolbar */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 mb-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-neutral-900 dark:text-white">Automation Controls:</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Reconciles billing ledger and MikroTik router state
          </span>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={loadReconciliation}
            disabled={isLoading}
            className="p-2 border border-neutral-200 text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
            title="Refresh reconciliation report"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsOverrideModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-xs font-medium rounded-xl transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-neutral-600" />
            <span>Manual Override</span>
          </button>

          <button
            onClick={() => setIsRunModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Lifecycle Engine</span>
          </button>
        </div>
      </div>

      {/* Last Execution Results Banner if Available */}
      {lastRunResult && (
        <div className="mb-6 p-5 rounded-2xl border border-neutral-200/80 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <div className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Recent Automation Execution ({lastRunResult.isDryRun ? 'Dry-Run Simulation' : 'Live Run'})
              </div>
              <div className="text-[11px] text-neutral-500 mt-0.5">
                Executed at {new Date(lastRunResult.executionDate).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-neutral-800">
                {lastRunResult.subscriptionsSuspended} Suspended
              </span>
              <span className="text-neutral-300">|</span>
              <span className="text-xs font-mono font-bold text-neutral-800">
                {lastRunResult.subscriptionsRestored} Restored
              </span>
              <span className="text-neutral-300">|</span>
              <span className="text-xs font-mono font-bold text-neutral-800">
                {lastRunResult.dueRemindersSent} Reminders
              </span>
            </div>
          </div>

          {lastRunResult.actions.length > 0 ? (
            <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200/60 overflow-hidden">
              {lastRunResult.actions.map((act, idx) => (
                <div key={idx} className="p-3 bg-neutral-50/50 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-neutral-900">{act.subscriberName}</span>
                    <span className="font-mono text-neutral-400 text-[11px] ml-2">({act.accountNumber})</span>
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
          ) : (
            <div className="text-xs text-neutral-400 italic">
              No subscriptions required suspension or restoration during this cycle.
            </div>
          )}
        </div>
      )}

      {/* Discrepancies & Service State Consistency Table */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-neutral-800" />
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
              Service State Reconciliation Audit
            </h3>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">
            Last checked: {report ? new Date(report.reconciledAt).toLocaleTimeString() : '...'}
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-neutral-400" />
            <p className="text-xs text-neutral-500">Checking service ledger discrepancies...</p>
          </div>
        ) : report && report.discrepancies.length > 0 ? (
          <div className="divide-y divide-neutral-100">
            {report.discrepancies.map((disc, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-neutral-50/60 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-900">{disc.subscriber}</span>
                    <span className="text-[11px] font-mono text-neutral-400">({disc.accountNumber})</span>
                  </div>
                  <div className="text-xs text-neutral-700 mt-1">{disc.issue}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    Recommended: {disc.resolution}
                  </div>
                </div>

                <button
                  onClick={() => setIsOverrideModalOpen(true)}
                  className="px-3 py-1.5 border border-neutral-200 hover:bg-neutral-100 text-neutral-800 text-xs font-medium rounded-xl transition-colors"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <ShieldCheck className="w-8 h-8 text-neutral-800 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-neutral-900">
              All Subscriptions Fully Reconciled
            </h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              There are zero discrepancies between subscription statuses, client invoice balances, and active network connections.
            </p>
          </div>
        )}
      </div>

      {/* Lifecycle Run Modal */}
      <LifecycleRunModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        onSuccess={(result) => {
          setLastRunResult(result);
          setSuccessMessage(
            `Lifecycle cycle completed: ${result.subscriptionsSuspended} suspended, ${result.subscriptionsRestored} restored.`
          );
          setTimeout(() => setSuccessMessage(''), 5000);
          loadReconciliation();
        }}
      />

      {/* Manual Override Modal */}
      <ManualOverrideModal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          setTimeout(() => setSuccessMessage(''), 5000);
          loadReconciliation();
        }}
      />
    </AppShell>
  );
}
