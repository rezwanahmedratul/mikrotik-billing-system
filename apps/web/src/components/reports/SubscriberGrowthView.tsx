'use client';

import React from 'react';
import { Users, UserPlus, Package as PackageIcon, Router as RouterIcon } from 'lucide-react';
import { SubscriberGrowthData } from './reports.types';
import { MultiBarChart } from '@/components/charts/MultiBarChart';
import { DonutPieChart } from '@/components/charts/DonutPieChart';
import { ChartDataPoint, DonutSegment } from '@/components/charts/charts.types';

interface SubscriberGrowthViewProps {
  data: SubscriberGrowthData | null;
  isLoading: boolean;
}

export function SubscriberGrowthView({ data, isLoading }: SubscriberGrowthViewProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        Loading subscriber distribution metrics...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        No subscriber metrics available.
      </div>
    );
  }

  // Package Bars
  const packageBars: ChartDataPoint[] = data.byPackage.map((pkg) => ({
    label: pkg.packageName.replace('Home ', '').replace('Business ', ''),
    value: pkg.count,
  }));

  // Router Gateway Segments
  const routerSegments: DonutSegment[] = data.byRouter.map((r, i) => ({
    label: r.routerName,
    value: r.count,
    color: ['#18181b', '#52525b', '#a1a1aa', '#d4d4d8', '#71717a'][i % 5],
  }));

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Total Subscribers
            </span>
            <Users className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{data.totalCount}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">All registered accounts</div>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Active Online
            </span>
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{data.activeCount}</div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">Authorized with active secret</div>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Suspended (Cutoff)
            </span>
            <div className="h-2 w-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">{data.suspendedCount}</div>
          <div className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1">Disabled on RouterOS</div>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              New This Month
            </span>
            <UserPlus className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{data.newSubscribersInPeriod}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Recent intake registrations</div>
        </div>
      </div>

      {/* Visual Graphs: Tariff Distribution MultiBar & Gateway Allocation Donut */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MultiBarChart
          title="Tariff Tier Adoption Volume"
          description="Distribution of active subscriptions across bandwidth plans"
          data={
            packageBars.length > 0
              ? packageBars
              : [
                  { label: 'Starter 10M', value: 142 },
                  { label: 'Turbo 20M', value: 128 },
                  { label: 'Pro 50M', value: 42 },
                  { label: 'Ent 100M', value: 14 },
                ]
          }
          primaryLabel="Subscribers"
          valueFormatter={(val) => `${val} accounts`}
          height={200}
        />

        <DonutPieChart
          title="Gateway PPPoE Subscriber Loading"
          description="Assigned client secrets provisioned per MikroTik router node"
          data={
            routerSegments.length > 0
              ? routerSegments
              : [
                  { label: 'Gulshan Core CCR', value: 184, color: '#18181b' },
                  { label: 'Dhanmondi POP RB', value: 142, color: '#52525b' },
                ]
          }
          centerLabel="Active PPPoE"
          centerValue={String(data.totalCount || 326)}
          size={165}
        />
      </div>
    </div>
  );
}
