'use client';

import React from 'react';
import { Users, Ban, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { ServiceReconciliationReport } from './lifecycle.types';
import { RadialProgressRing } from '@/components/charts/RadialProgressRing';
import { MetricSparkline } from '@/components/charts/MetricSparkline';

interface LifecycleStatsCardsProps {
  report: ServiceReconciliationReport | null;
  lastRunResult?: {
    suspended: number;
    restored: number;
    reminders: number;
    isDryRun: boolean;
  } | null;
}

export const LifecycleStatsCards: React.FC<LifecycleStatsCardsProps> = ({
  report,
  lastRunResult,
}) => {
  const activeCount = report?.activeCount ?? 0;
  const suspendedCount = report?.suspendedCount ?? 0;
  const discrepanciesCount = report?.discrepancies.length ?? 0;

  const total = activeCount + suspendedCount || 1;
  const healthPct = Math.round((activeCount / total) * 100);
  const activeSparkline = [14, 16, 19, 18, 20, 21, 23, 22, 24, activeCount || 24];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Active Subscriptions */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Active Online
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between mt-2">
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{activeCount}</div>
          <MetricSparkline data={activeSparkline} height={26} width={75} color="currentColor" />
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Normal service status</div>
      </div>

      {/* Suspended Subscriptions */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Suspended (Cutoff)
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <Ban className="w-4 h-4 text-neutral-900 dark:text-white" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{suspendedCount}</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Awaiting invoice payment</div>
          </div>
          <RadialProgressRing
            percentage={healthPct}
            size={50}
            strokeWidth={5}
            color="currentColor"
          />
        </div>
      </div>

      {/* Recent Auto Restorations */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Auto Restorations
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <RefreshCw className="w-4 h-4 text-neutral-900 dark:text-white" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white mt-2">
          {lastRunResult ? lastRunResult.restored : 0}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {lastRunResult?.isDryRun ? 'Projected in simulation' : 'Restored after settlement'}
        </div>
      </div>

      {/* Service Discrepancies */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Discrepancies
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
            {discrepanciesCount === 0 ? (
              <ShieldCheck className="w-4 h-4 text-neutral-900 dark:text-white" />
            ) : (
              <AlertCircle className="w-4 h-4 text-neutral-900 dark:text-white" />
            )}
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white mt-2">{discrepanciesCount}</div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {discrepanciesCount === 0 ? 'All subscriptions reconciled' : 'Requires review'}
        </div>
      </div>
    </div>
  );
};
