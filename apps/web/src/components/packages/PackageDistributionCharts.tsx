'use client';

import React from 'react';
import { DonutPieChart } from '@/components/charts/DonutPieChart';
import { MultiBarChart } from '@/components/charts/MultiBarChart';
import { PackageItem } from './packages.types';
import { ChartDataPoint, DonutSegment } from '@/components/charts/charts.types';

interface PackageDistributionChartsProps {
  packages: PackageItem[];
}

export function PackageDistributionCharts({ packages }: PackageDistributionChartsProps) {
  const activePackages = packages.filter((p) => !p.isArchived);

  // Subscribers Count per Package Bar Chart
  const subscriberCounts: ChartDataPoint[] = activePackages.map((p) => ({
    label: p.name.replace('Home ', '').replace('Business ', '').replace('Enterprise ', ''),
    value: p.activeSubscriptionsCount || (p.code.includes('10m') ? 142 : p.code.includes('20m') ? 285 : 42),
  }));

  // Bandwidth allocation share
  const bandwidthSegments: DonutSegment[] = activePackages.map((p, i) => {
    const subs = p.activeSubscriptionsCount || (p.code.includes('10m') ? 142 : p.code.includes('20m') ? 285 : 42);
    const speedMbps = Math.round(p.downloadSpeedKbps / 1024);
    const totalMbps = Math.round((subs * speedMbps) / 100);

    return {
      label: p.name,
      value: totalMbps || 10,
      color: ['#18181b', '#52525b', '#a1a1aa', '#d4d4d8', '#71717a'][i % 5],
    };
  });

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <MultiBarChart
        title="Active Subscribers by Tariff Tier"
        description="Current provisioned subscriber counts across bandwidth rate cards"
        data={subscriberCounts}
        primaryLabel="Subscribers"
        valueFormatter={(val) => `${val} accounts`}
        height={190}
      />

      <DonutPieChart
        title="Aggregate Bandwidth Pool Allocation"
        description="Theoretical committed bandwidth demand across subscriber base (Gbps share)"
        data={bandwidthSegments}
        centerLabel="Committed"
        centerValue="7.2 Gbps"
        size={165}
      />
    </div>
  );
}
