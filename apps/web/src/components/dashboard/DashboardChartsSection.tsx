'use client';

import React from 'react';
import { AreaTrendChart } from '@/components/charts/AreaTrendChart';
import { MultiBarChart } from '@/components/charts/MultiBarChart';
import { DonutPieChart } from '@/components/charts/DonutPieChart';
import { ChartDataPoint, DonutSegment } from '@/components/charts/charts.types';

export function DashboardChartsSection() {
  // 24-Hour Network Throughput (Download & Upload in Mbps)
  const trafficData: ChartDataPoint[] = [
    { label: '00:00', value: 340, secondaryValue: 120 },
    { label: '03:00', value: 180, secondaryValue: 70 },
    { label: '06:00', value: 260, secondaryValue: 95 },
    { label: '09:00', value: 680, secondaryValue: 240 },
    { label: '12:00', value: 890, secondaryValue: 310 },
    { label: '15:00', value: 940, secondaryValue: 330 },
    { label: '18:00', value: 1280, secondaryValue: 420 },
    { label: '21:00', value: 1450, secondaryValue: 490 },
    { label: '23:00', value: 920, secondaryValue: 290 },
  ];

  // 6-Month Ledger Revenue vs Collections (in thousands BDT)
  const billingData: ChartDataPoint[] = [
    { label: 'May', value: 180, secondaryValue: 172 },
    { label: 'Jun', value: 195, secondaryValue: 188 },
    { label: 'Jul', value: 210, secondaryValue: 205 },
    { label: 'Aug', value: 228, secondaryValue: 220 },
    { label: 'Sep', value: 236, secondaryValue: 229 },
    { label: 'Oct', value: 245, secondaryValue: 198 },
  ];

  // Active Subscriber Package Distribution
  const packageDistribution: DonutSegment[] = [
    { label: 'Home Starter 10M', value: 142, color: '#18181b' },
    { label: 'Home Turbo 20M', value: 128, color: '#52525b' },
    { label: 'Business Pro 50M', value: 42, color: '#a1a1aa' },
    { label: 'Enterprise 100M', value: 14, color: '#d4d4d8' },
  ];

  return (
    <div className="space-y-6">
      {/* Network Traffic Throughput Graph */}
      <AreaTrendChart
        title="Network Bandwidth & Throughput Telemetry"
        description="24-hour aggregate PPPoE traffic across all online RouterOS core gateways"
        data={trafficData}
        primaryLabel="Download (Mbps)"
        secondaryLabel="Upload (Mbps)"
        valueFormatter={(val) => `${val} Mbps`}
        height={220}
      />

      {/* Two-Column Charts Grid: Revenue Bar Chart & Package Donut Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MultiBarChart
          title="6-Month Invoiced vs Collected Ledger"
          description="Monthly recurring billing runs vs confirmed cashier and gateway payments (৳ thousands)"
          data={billingData}
          primaryLabel="Billed (৳k)"
          secondaryLabel="Collected (৳k)"
          valueFormatter={(val) => `৳${val}k`}
          height={220}
        />

        <DonutPieChart
          title="Active Subscribers by Tariff Package"
          description="Bandwidth tier breakdown across provisioned customer accounts"
          data={packageDistribution}
          centerLabel="Active Plans"
          centerValue="326"
          size={175}
        />
      </div>
    </div>
  );
}
