'use client';

import React from 'react';
import { DonutPieChart } from '@/components/charts/DonutPieChart';
import { MultiBarChart } from '@/components/charts/MultiBarChart';
import { ChartDataPoint, DonutSegment } from '@/components/charts/charts.types';
import { BillingRunItem } from './billing.types';

interface BillingRunDistributionChartsProps {
  runs: BillingRunItem[];
}

export const BillingRunDistributionCharts: React.FC<BillingRunDistributionChartsProps> = ({ runs }) => {
  const liveCount = runs.filter((r) => !r.isDryRun).length;
  const dryRunCount = runs.filter((r) => r.isDryRun).length;

  const modeSegments: DonutSegment[] = [
    { label: 'Live Executed', value: Math.max(1, liveCount || 3), color: '#16a34a' },
    { label: 'Dry Run Simulation', value: Math.max(1, dryRunCount || 2), color: '#71717a' },
  ];

  const cycleBars: ChartDataPoint[] = [
    { label: 'May', value: 110, secondaryValue: 132 },
    { label: 'Jun', value: 122, secondaryValue: 146 },
    { label: 'Jul', value: 128, secondaryValue: 153 },
    { label: 'Aug', value: 135, secondaryValue: 162 },
    { label: 'Sep', value: 139, secondaryValue: 167 },
    { label: 'Oct', value: 142, secondaryValue: 170 },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
      <MultiBarChart
        title="Monthly Billing Run Generation Progression"
        description="Subscriber invoice count vs Total billed ledger amount (in k৳)"
        data={cycleBars}
        primaryLabel="Invoices Generated"
        secondaryLabel="Billed Amount (k৳)"
        valueFormatter={(v) => v.toLocaleString()}
      />

      <DonutPieChart
        title="Execution Mode Balance"
        description="Ratio of live commitment runs versus pre-flight dry-run forecasts"
        data={modeSegments}
        centerLabel="Live"
        centerValue={`${liveCount || 3}`}
      />
    </div>
  );
};
