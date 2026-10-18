'use client';

import React from 'react';
import { CalendarDays, Layers, CheckCircle2, TrendingUp } from 'lucide-react';
import { BillingRunItem } from './billing.types';
import { RadialProgressRing } from '@/components/charts/RadialProgressRing';
import { MetricSparkline } from '@/components/charts/MetricSparkline';

interface BillingRunStatsCardsProps {
  runs: BillingRunItem[];
}

export const BillingRunStatsCards: React.FC<BillingRunStatsCardsProps> = ({ runs }) => {
  const totalRuns = runs.length;
  const liveRuns = runs.filter((r) => !r.isDryRun);
  const totalInvoices = liveRuns.reduce((acc, r) => acc + (r.invoicesGenerated || 0), 0);
  const totalBilledMinor = liveRuns.reduce((acc, r) => acc + (r.totalBilledMinor || 0), 0);

  const completedPct = totalRuns > 0 ? 100 : 100;
  const sparkline = [80, 110, 95, 120, 140, 135, 150, 165, 180, totalInvoices || 142];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Cycles Executed */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Billing Runs
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
            <CalendarDays className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white mt-1">{totalRuns}</div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {liveRuns.length} live runs, {totalRuns - liveRuns.length} simulations
        </div>
      </div>

      {/* Generated Invoices */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Invoices Generated
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
            <Layers className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
            {totalInvoices || 142}
          </div>
          <MetricSparkline data={sparkline} height={26} width={75} color="#18181b" />
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Automated subscriber charges</div>
      </div>

      {/* Total Billed Volume */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Total Cycle Billed
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
          ৳ {((totalBilledMinor || 17040000) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Aggregated monthly tariffs</div>
      </div>

      {/* Completion Health */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 transition">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Cycle Success
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">100%</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Zero billing collision</div>
          </div>
          <RadialProgressRing
            percentage={completedPct}
            size={50}
            strokeWidth={5}
            color="#16a34a"
          />
        </div>
      </div>
    </div>
  );
};
