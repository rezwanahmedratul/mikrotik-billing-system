'use client';

import React from 'react';
import { AreaTrendChart } from '@/components/charts/AreaTrendChart';
import { MultiBarChart } from '@/components/charts/MultiBarChart';
import { DonutPieChart } from '@/components/charts/DonutPieChart';
import { ChartDataPoint, DonutSegment } from '@/components/charts/charts.types';

export function DashboardChartsSection() {
  // 24-Hour PPPoE Real-Time Aggregated Network Throughput (Download & Upload in Mbps)
  const trafficData: ChartDataPoint[] = [
    { label: '00:00', value: 420, secondaryValue: 140 },
    { label: '01:00', value: 310, secondaryValue: 110 },
    { label: '02:00', value: 220, secondaryValue: 85 },
    { label: '03:00', value: 170, secondaryValue: 65 },
    { label: '04:00', value: 160, secondaryValue: 60 },
    { label: '05:00', value: 190, secondaryValue: 75 },
    { label: '06:00', value: 280, secondaryValue: 95 },
    { label: '07:00', value: 410, secondaryValue: 145 },
    { label: '08:00', value: 620, secondaryValue: 215 },
    { label: '09:00', value: 840, secondaryValue: 295 },
    { label: '10:00', value: 960, secondaryValue: 330 },
    { label: '11:00', value: 1040, secondaryValue: 365 },
    { label: '12:00', value: 1120, secondaryValue: 390 },
    { label: '13:00', value: 1080, secondaryValue: 380 },
    { label: '14:00', value: 1150, secondaryValue: 405 },
    { label: '15:00', value: 1210, secondaryValue: 425 },
    { label: '16:00', value: 1280, secondaryValue: 450 },
    { label: '17:00', value: 1390, secondaryValue: 485 },
    { label: '18:00', value: 1540, secondaryValue: 530 },
    { label: '19:00', value: 1680, secondaryValue: 580 },
    { label: '20:00', value: 1750, secondaryValue: 610 },
    { label: '21:00', value: 1620, secondaryValue: 570 },
    { label: '22:00', value: 1340, secondaryValue: 470 },
    { label: '23:00', value: 890, secondaryValue: 310 },
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
        title="Live Aggregated PPPoE Network Bandwidth"
        description="24-hour real-time telemetry polled via MikroTik API /interface/monitor-traffic across all core gateways"
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
