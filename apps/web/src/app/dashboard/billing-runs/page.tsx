'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Play,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { fetchApi } from '@/lib/api';
import { BillingRunItem } from '@/components/billing/billing.types';
import { BillingRunStatsCards } from '@/components/billing/BillingRunStatsCards';
import { BillingRunDistributionCharts } from '@/components/billing/BillingRunDistributionCharts';

export default function BillingRunsPage() {
  const [runs, setRuns] = useState<BillingRunItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Trigger Billing Run Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDryRun, setIsDryRun] = useState(true);
  const [cycleStart, setCycleStart] = useState('');
  const [cycleEnd, setCycleEnd] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forecastResult, setForecastResult] = useState<BillingRunItem | null>(null);

  const loadRuns = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const res = await fetchApi<BillingRunItem[]>('/billing-runs');
    setIsLoading(false);

    if (res.error) {
      // Demo fallback
      setRuns([
        {
          id: 'run-1',
          tenantId: 't-1',
          executionDate: new Date('2026-10-01T00:00:00Z').toISOString(),
          cycleStart: new Date('2026-10-01T00:00:00Z').toISOString(),
          cycleEnd: new Date('2026-10-31T23:59:59Z').toISOString(),
          invoicesGenerated: 142,
          totalBilledMinor: 17040000,
          totalBilledFormatted: 'BDT 170400.00',
          status: 'COMPLETED',
          isDryRun: false,
          triggeredBy: 'Alice Accountant',
        },
      ]);
    } else if (res.data) {
      setRuns(res.data);
    }
  };

  useEffect(() => {
    loadRuns();

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    setCycleStart(firstDay);
    setCycleEnd(lastDay);
  }, []);

  const handleExecuteRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setForecastResult(null);

    const res = await fetchApi<BillingRunItem>('/billing-runs', {
      method: 'POST',
      body: JSON.stringify({
        isDryRun,
        cycleStart: new Date(cycleStart).toISOString(),
        cycleEnd: new Date(cycleEnd).toISOString(),
      }),
    });

    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.data) {
      if (res.data.isDryRun) {
        setForecastResult(res.data);
      } else {
        setIsModalOpen(false);
        setSuccessMessage(
          `Billing run completed! Generated ${res.data.invoicesGenerated} invoices (${res.data.totalBilledFormatted}).`
        );
        setTimeout(() => setSuccessMessage(''), 5000);
        loadRuns();
      }
    }
  };

  return (
    <AppShell
      title="Recurring Billing Runs"
      description="Automate monthly broadband subscription invoice runs, forecast projected billing totals with dry-run simulations, and review ledger batches."
      action={
        <button
          onClick={() => {
            setIsDryRun(true);
            setForecastResult(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-xl transition-colors shadow-sm"
        >
          <Play className="w-3.5 h-3.5" />
          <span>New Billing Run</span>
        </button>
      }
    >
      {/* Alert Notifications */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl border border-neutral-300 bg-neutral-100 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-neutral-900 dark:text-white flex-shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl border border-neutral-300 bg-neutral-100 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-neutral-900 dark:text-white flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <BillingRunStatsCards runs={runs} />

      {/* Monthly Cycle Progression & Execution Mode Charts */}
      <BillingRunDistributionCharts runs={runs} />

      {/* History Table */}
      <DataTable<BillingRunItem>
        columns={[
          {
            key: 'run',
            header: 'Execution Date & Trigger',
            render: (run: BillingRunItem) => (
              <div>
                <span className="font-mono font-bold text-neutral-900 text-xs">
                  {new Date(run.executionDate).toLocaleString()}
                </span>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Triggered by: {run.triggeredBy || 'Automated Cron'}
                </div>
              </div>
            ),
          },
          {
            key: 'cycle',
            header: 'Billing Period Cycle',
            render: (run: BillingRunItem) => (
              <div className="font-mono text-xs text-neutral-700">
                {new Date(run.cycleStart).toLocaleDateString()} -{' '}
                {new Date(run.cycleEnd).toLocaleDateString()}
              </div>
            ),
          },
          {
            key: 'invoices',
            header: 'Invoices Generated',
            render: (run: BillingRunItem) => (
              <div className="font-mono text-xs font-semibold text-neutral-900">
                {run.invoicesGenerated} invoices
              </div>
            ),
          },
          {
            key: 'total',
            header: 'Total Billed Amount',
            render: (run: BillingRunItem) => (
              <div className="font-mono text-xs font-bold text-neutral-900">
                {run.totalBilledFormatted}
              </div>
            ),
          },
          {
            key: 'type',
            header: 'Execution Type',
            render: (run: BillingRunItem) => (
              <StatusBadge
                status={run.isDryRun ? 'DRY_RUN' : 'LIVE'}
                variant={run.isDryRun ? 'warning' : 'success'}
                label={run.isDryRun ? 'Dry Run Simulation' : 'Live Invoiced'}
              />
            ),
          },
        ]}
        data={runs}
        keyExtractor={(r) => r.id}
        isLoading={isLoading}
        emptyTitle="No billing runs recorded"
        emptyDescription="Execute your first batch billing run to invoice active subscribers."
      />

      {/* Trigger Billing Run Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Execute Recurring Billing Run"
        description="Invoice all eligible active subscribers for the selected billing cycle with automatic duplicate prevention."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleExecuteRun} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Cycle Start *
              </label>
              <input
                type="date"
                required
                value={cycleStart}
                onChange={(e) => setCycleStart(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-mono text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Cycle End *
              </label>
              <input
                type="date"
                required
                value={cycleEnd}
                onChange={(e) => setCycleEnd(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-mono text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
              />
            </div>
          </div>

          {/* Dry Run Toggle */}
          <div className="p-3.5 bg-neutral-50 border border-neutral-200/80 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="dryrun"
                checked={isDryRun}
                onChange={(e) => setIsDryRun(e.target.checked)}
                className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 h-4 w-4"
              />
              <label htmlFor="dryrun" className="text-xs font-bold text-neutral-900">
                Dry Run Simulation (Recommended First)
              </label>
            </div>
            <p className="text-[11px] text-neutral-500 pl-6 leading-relaxed">
              Calculates eligible subscriptions and projected billed revenue without generating real invoices or modifying subscriber balances.
            </p>
          </div>

          {/* Dry Run Forecast Receipt */}
          {forecastResult && (
            <div className="p-4 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-2xl space-y-2 text-xs text-neutral-900 dark:text-neutral-100 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px]">
                <FileSpreadsheet className="w-4 h-4 text-neutral-900 dark:text-white" />
                <span>Dry Run Simulation Forecast</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">Eligible Subscriptions:</span>
                  <span className="font-bold text-sm">{forecastResult.invoicesGenerated} clients</span>
                </div>
                <div>
                  <span className="text-neutral-500 dark:text-neutral-400 block text-[11px]">Projected Total Revenue:</span>
                  <span className="font-bold text-sm">{forecastResult.totalBilledFormatted}</span>
                </div>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pt-1 border-t border-neutral-200 dark:border-neutral-800">
                To proceed with actual invoice creation, uncheck &quot;Dry Run Simulation&quot; above and click &quot;Execute Live Run&quot;.
              </p>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 text-xs font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5 bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              {isDryRun ? 'Calculate Forecast' : 'Execute Live Run'}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
