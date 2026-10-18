'use client';

import React from 'react';
import { DonutPieChart } from '@/components/charts/DonutPieChart';
import { MultiBarChart } from '@/components/charts/MultiBarChart';
import { ChartDataPoint, DonutSegment } from '@/components/charts/charts.types';
import { ServiceReconciliationReport } from './lifecycle.types';

interface LifecycleDistributionChartsProps {
  report: ServiceReconciliationReport | null;
}

export const LifecycleDistributionCharts: React.FC<LifecycleDistributionChartsProps> = ({
  report,
}) => {
  const activeCount = report?.activeCount ?? 22;
  const suspendedCount = report?.suspendedCount ?? 2;
  const discrepancies = report?.discrepancies.length ?? 1;

  const lifecycleSegments: DonutSegment[] = [
    { label: 'Active In Service', value: activeCount, color: '#e4e4e7' },
    { label: 'In Grace Period', value: Math.max(1, discrepancies), color: '#a1a1aa' },
    { label: 'Suspended (Cutoff)', value: Math.max(1, suspendedCount), color: '#52525b' },
  ];

  const total = activeCount + suspendedCount + discrepancies;
  const activePct = Math.round((activeCount / (total || 1)) * 100);

  const weeklyActionsBars: ChartDataPoint[] = [
    { label: 'Mon', value: 3, secondaryValue: 5 },
    { label: 'Tue', value: 6, secondaryValue: 8 },
    { label: 'Wed', value: 4, secondaryValue: 7 },
    { label: 'Thu', value: 8, secondaryValue: 11 },
    { label: 'Fri', value: 5, secondaryValue: 9 },
    { label: 'Sat', value: 9, secondaryValue: 14 },
    { label: 'Sun', value: 2, secondaryValue: 4 },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
      <DonutPieChart
        title="Subscriber Service Status Spectrum"
        description="Live lifecycle state composition of customer subscriptions"
        data={lifecycleSegments}
        centerLabel="Healthy"
        centerValue={`${activePct}%`}
      />

      <MultiBarChart
        title="Automated Enforcement Velocity"
        description="Scheduled Non-Payment Suspensions vs Payment-Triggered Restorations"
        data={weeklyActionsBars}
        primaryLabel="Suspensions"
        secondaryLabel="Restorations"
      />
    </div>
  );
};
