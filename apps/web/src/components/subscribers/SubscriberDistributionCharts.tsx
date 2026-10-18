'use client';

import React from 'react';
import { DonutPieChart } from '@/components/charts/DonutPieChart';
import { MultiBarChart } from '@/components/charts/MultiBarChart';
import { SubscriberItem } from './subscribers.types';
import { ChartDataPoint, DonutSegment } from '@/components/charts/charts.types';

interface SubscriberDistributionChartsProps {
  subscribers: SubscriberItem[];
  totalCount: number;
}

export function SubscriberDistributionCharts({
  subscribers,
  totalCount,
}: SubscriberDistributionChartsProps) {
  const activeCount = subscribers.filter(
    (s) => s.currentSubscription?.status === 'ACTIVE'
  ).length;

  const suspendedCount = subscribers.filter(
    (s) => s.currentSubscription?.status === 'SUSPENDED' || s.pppoeAccount?.isSuspended
  ).length;

  const expiredCount = subscribers.filter(
    (s) => s.currentSubscription?.status === 'EXPIRED' || (s.currentSubscription?.daysRemaining ?? 1) <= 0
  ).length;

  const pendingCount = Math.max(0, (totalCount || subscribers.length) - activeCount - suspendedCount - expiredCount);

  const statusSegments: DonutSegment[] = [
    { label: 'Active Broadband', value: activeCount, color: '#16a34a' },
    { label: 'Suspended (Cut-off)', value: suspendedCount, color: '#dc2626' },
    { label: 'Expired / Due', value: expiredCount, color: '#ca8a04' },
    ...(pendingCount > 0 ? [{ label: 'Pending Provisioning', value: pendingCount, color: '#71717a' }] : []),
  ];

  // 6-Month Subscriber Intake (Registrations vs Activations)
  const intakeHistory: ChartDataPoint[] = [
    { label: 'May', value: 14, secondaryValue: 12 },
    { label: 'Jun', value: 22, secondaryValue: 20 },
    { label: 'Jul', value: 18, secondaryValue: 18 },
    { label: 'Aug', value: 29, secondaryValue: 26 },
    { label: 'Sep', value: 34, secondaryValue: 31 },
    { label: 'Oct', value: 28, secondaryValue: 25 },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <DonutPieChart
        title="Subscriber Account Health Breakdown"
        description="Current operational lifecycle status across subscriber database"
        data={statusSegments}
        centerLabel="Subscribers"
        centerValue={String(totalCount || subscribers.length)}
        size={170}
      />

      <MultiBarChart
        title="Subscriber Growth & Provisioning Velocity"
        description="New accounts registered vs successfully provisioned on RouterOS (Last 6 Months)"
        data={intakeHistory}
        primaryLabel="Registered"
        secondaryLabel="Provisioned"
        valueFormatter={(val) => `${val} users`}
        height={190}
      />
    </div>
  );
}
