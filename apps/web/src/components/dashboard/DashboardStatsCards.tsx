'use client';

import React from 'react';
import { Users, Radio, Router as RouterIcon, Receipt, ArrowUpRight } from 'lucide-react';
import { DashboardMetrics } from './dashboard.types';
import { MetricSparkline } from '@/components/charts/MetricSparkline';
import { RadialProgressRing } from '@/components/charts/RadialProgressRing';

interface DashboardStatsCardsProps {
  metrics: DashboardMetrics;
}

export function DashboardStatsCards({ metrics }: DashboardStatsCardsProps) {
  // Mock sparkline telemetry trends for visually rich cards
  const subscriberTrend = [298, 304, 309, 312, 318, 321, 326];
  const sessionsTrend = [285, 310, 298, 335, 318, 322, metrics.onlineSessions];
  const routerHealthTrend = [98, 99, 100, 99, 100, 100, 100];
  const collectionPercent = parseFloat(metrics.collectionRate) || 80.5;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Active Subscribers */}
      <div className="group rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700 interactive-card dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Active Subscribers
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition group-hover:bg-neutral-900 group-hover:text-white dark:bg-neutral-900 dark:text-neutral-300 dark:group-hover:bg-white dark:group-hover:text-neutral-900">
            <Users className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
              {metrics.activeSubscribers.toLocaleString()}
            </span>
            <div className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {metrics.subscribersDelta}
            </div>
          </div>
          <div className="w-20">
            <MetricSparkline data={subscriberTrend} color="currentColor" height={28} width={80} />
          </div>
        </div>

        <div className="mt-3 text-[11px] text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-neutral-800/80 pt-2">
          Assigned to active speed packages
        </div>
      </div>

      {/* Card 2: Live PPPoE Sessions */}
      <div className="group rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700 interactive-card dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Live PPPoE Sessions
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition group-hover:bg-neutral-900 group-hover:text-white dark:bg-neutral-900 dark:text-neutral-300 dark:group-hover:bg-white dark:group-hover:text-neutral-900">
            <Radio className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
              {metrics.onlineSessions.toLocaleString()}
            </span>
            <div className="mt-0.5 inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900 dark:bg-white animate-pulse" />
              <span>Live Sync</span>
            </div>
          </div>
          <div className="w-20">
            <MetricSparkline data={sessionsTrend} color="currentColor" height={28} width={80} />
          </div>
        </div>

        <div className="mt-3 text-[11px] text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-neutral-800/80 pt-2">
          Across RouterOS core gateways
        </div>
      </div>

      {/* Card 3: Router Gateways */}
      <div className="group rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700 interactive-card dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Router Gateways
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition group-hover:bg-neutral-900 group-hover:text-white dark:bg-neutral-900 dark:text-neutral-300 dark:group-hover:bg-white dark:group-hover:text-neutral-900">
            <RouterIcon className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <div>
            <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
              {metrics.onlineRoutersCount} / {metrics.totalRoutersCount}
            </span>
            <div className="mt-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              100% Online
            </div>
          </div>
          <div className="w-20">
            <MetricSparkline data={routerHealthTrend} color="currentColor" height={28} width={80} />
          </div>
        </div>

        <div className="mt-3 text-[11px] text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-neutral-800/80 pt-2">
          Avg CPU: 18% &bull; Latency &lt; 5ms
        </div>
      </div>

      {/* Card 4: Current Month Billed */}
      <div className="group rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700 interactive-card dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Current Month Billed
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition group-hover:bg-neutral-900 group-hover:text-white dark:bg-neutral-900 dark:text-neutral-300 dark:group-hover:bg-white dark:group-hover:text-neutral-900">
            <Receipt className="h-4 w-4" />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
              {metrics.currentMonthBilledFormatted}
            </span>
            <div className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {metrics.currentMonthPaidFormatted} Paid
            </div>
          </div>
          <RadialProgressRing
            percentage={collectionPercent}
            size={48}
            strokeWidth={5}
            color="currentColor"
            label={`${Math.round(collectionPercent)}%`}
          />
        </div>

        <div className="mt-3 text-[11px] text-neutral-400 dark:text-neutral-500 border-t border-neutral-100 dark:border-neutral-800/80 pt-2">
          {metrics.collectionRate} collection rate
        </div>
      </div>
    </div>
  );
}
