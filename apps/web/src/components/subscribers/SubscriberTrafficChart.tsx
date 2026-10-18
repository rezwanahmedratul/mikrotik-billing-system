'use client';

import React from 'react';
import { MultiBarChart } from '@/components/charts/MultiBarChart';
import { ChartDataPoint } from '@/components/charts/charts.types';
import { HardDriveDownload, ArrowDown, ArrowUp } from 'lucide-react';

interface SubscriberTrafficChartProps {
  username?: string;
}

export function SubscriberTrafficChart({ username }: SubscriberTrafficChartProps) {
  // 14-Day Traffic Usage Profile (Download vs Upload in GB)
  const dailyTraffic: ChartDataPoint[] = [
    { label: '05 Oct', value: 12.4, secondaryValue: 2.1 },
    { label: '06 Oct', value: 18.2, secondaryValue: 3.4 },
    { label: '07 Oct', value: 15.6, secondaryValue: 2.8 },
    { label: '08 Oct', value: 24.1, secondaryValue: 4.5 },
    { label: '09 Oct', value: 21.0, secondaryValue: 3.9 },
    { label: '10 Oct', value: 28.5, secondaryValue: 5.2 },
    { label: '11 Oct', value: 32.1, secondaryValue: 6.1 },
    { label: '12 Oct', value: 19.4, secondaryValue: 3.3 },
    { label: '13 Oct', value: 22.8, secondaryValue: 4.0 },
    { label: '14 Oct', value: 27.2, secondaryValue: 4.9 },
    { label: '15 Oct', value: 35.0, secondaryValue: 6.8 },
    { label: '16 Oct', value: 31.2, secondaryValue: 5.7 },
    { label: '17 Oct', value: 26.5, secondaryValue: 4.8 },
    { label: '18 Oct', value: 18.9, secondaryValue: 3.2 },
  ];

  const totalDown = dailyTraffic.reduce((sum, d) => sum + d.value, 0).toFixed(1);
  const totalUp = dailyTraffic.reduce((sum, d) => sum + (d.secondaryValue ?? 0), 0).toFixed(1);

  return (
    <div className="space-y-3">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Daily Bandwidth Consumption History
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            RouterOS accounting logs for user secret <span className="font-mono font-medium text-neutral-800 dark:text-neutral-200">{username || 'client'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-white px-3 py-1 text-xs shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
            <ArrowDown className="h-3.5 w-3.5 text-neutral-900 dark:text-white" />
            <span className="font-mono font-bold text-neutral-900 dark:text-white">{totalDown} GB</span>
            <span className="text-[10px] text-neutral-400">Down</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-white px-3 py-1 text-xs shadow-2xs dark:border-neutral-800 dark:bg-neutral-900">
            <ArrowUp className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
            <span className="font-mono font-bold text-neutral-700 dark:text-neutral-300">{totalUp} GB</span>
            <span className="text-[10px] text-neutral-400">Up</span>
          </div>
        </div>
      </div>

      <MultiBarChart
        data={dailyTraffic}
        primaryLabel="Download (GB)"
        secondaryLabel="Upload (GB)"
        valueFormatter={(val) => `${val} GB`}
        height={210}
      />
    </div>
  );
}
