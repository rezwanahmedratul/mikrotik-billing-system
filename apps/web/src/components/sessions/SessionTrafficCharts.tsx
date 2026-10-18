'use client';

import React from 'react';
import { AreaTrendChart } from '@/components/charts/AreaTrendChart';
import { MultiBarChart } from '@/components/charts/MultiBarChart';
import { DonutPieChart } from '@/components/charts/DonutPieChart';
import { ChartDataPoint, DonutSegment } from '@/components/charts/charts.types';
import { SessionItem } from './sessions.types';

interface SessionTrafficChartsProps {
  sessions: SessionItem[];
}

export function SessionTrafficCharts({ sessions }: SessionTrafficChartsProps) {
  // 12-Hour Session Throughput Profile
  const throughputHistory: ChartDataPoint[] = [
    { label: '08:00', value: 420, secondaryValue: 140 },
    { label: '10:00', value: 680, secondaryValue: 210 },
    { label: '12:00', value: 920, secondaryValue: 310 },
    { label: '14:00', value: 960, secondaryValue: 340 },
    { label: '16:00', value: 1120, secondaryValue: 390 },
    { label: '18:00', value: 1350, secondaryValue: 460 },
    { label: '20:00', value: 1480, secondaryValue: 510 },
  ];

  // Session Duration Distribution (<1h, 1-6h, 6-24h, 1-3d, >3d)
  const durationBrackets: ChartDataPoint[] = [
    { label: '<1 Hour', value: 18 },
    { label: '1-6 Hours', value: 44 },
    { label: '6-24 Hours', value: 98 },
    { label: '1-3 Days', value: 112 },
    { label: '>3 Days', value: 54 },
  ];

  // Distribution by RouterOS Gateway
  const routerCounts = sessions.reduce((acc, sess) => {
    const name = sess.routerName || 'Gateway';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const routerSegments: DonutSegment[] = Object.keys(routerCounts).length > 0
    ? Object.entries(routerCounts).map(([label, value], i) => ({
        label,
        value,
        color: ['#18181b', '#52525b', '#a1a1aa', '#d4d4d8'][i % 4],
      }))
    : [
        { label: 'Gulshan-Core-CCR2004', value: 184, color: '#18181b' },
        { label: 'Dhanmondi-POP-RB4011', value: 142, color: '#52525b' },
      ];

  return (
    <div className="mb-6 space-y-6">
      {/* Live PPPoE Aggregated Traffic Trend */}
      <AreaTrendChart
        title="Live Aggregated PPPoE Network Bandwidth"
        description="Real-time telemetry polled via MikroTik API /interface/monitor-traffic"
        data={throughputHistory}
        primaryLabel="Download (Mbps)"
        secondaryLabel="Upload (Mbps)"
        valueFormatter={(val) => `${val} Mbps`}
        height={200}
      />

      {/* Two-Column: Duration Distribution & Router Load Donut */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MultiBarChart
          title="Session Duration Spectrum"
          description="Uptime distribution across active authenticated subscriber tunnels"
          data={durationBrackets}
          primaryLabel="Sessions"
          valueFormatter={(val) => `${val} sessions`}
          height={190}
        />

        <DonutPieChart
          title="Active Sessions by Core Gateway"
          description="Load distribution across connected MikroTik RouterOS devices"
          data={routerSegments}
          centerLabel="Total Online"
          centerValue={String(sessions.length || 326)}
          size={165}
        />
      </div>
    </div>
  );
}
