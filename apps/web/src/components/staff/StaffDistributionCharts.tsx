'use client';

import React from 'react';
import { DonutPieChart } from '@/components/charts/DonutPieChart';
import { MultiBarChart } from '@/components/charts/MultiBarChart';
import { ChartDataPoint, DonutSegment } from '@/components/charts/charts.types';
import { StaffMember } from './staff.types';

interface StaffDistributionChartsProps {
  staff: StaffMember[];
}

export const StaffDistributionCharts: React.FC<StaffDistributionChartsProps> = ({ staff }) => {
  const admins = staff.filter((s) => s.role === 'ISP_ADMIN').length || 2;
  const operators = staff.filter((s) => s.role === 'ISP_OPERATOR').length || 2;
  const cashiers = staff.filter((s) => s.role === 'CASHIER').length || 2;

  const roleSegments: DonutSegment[] = [
    { label: 'ISP Administrators', value: admins, color: '#18181b' },
    { label: 'NOC Operators', value: operators, color: '#52525b' },
    { label: 'Billing Cashiers', value: cashiers, color: '#a1a1aa' },
  ];

  const weeklyActivityBars: ChartDataPoint[] = [
    { label: 'Mon', value: 16, secondaryValue: 24 },
    { label: 'Tue', value: 22, secondaryValue: 31 },
    { label: 'Wed', value: 28, secondaryValue: 39 },
    { label: 'Thu', value: 19, secondaryValue: 29 },
    { label: 'Fri', value: 34, secondaryValue: 48 },
    { label: 'Sat', value: 42, secondaryValue: 56 },
    { label: 'Sun', value: 14, secondaryValue: 20 },
  ];

  const totalMembers = admins + operators + cashiers;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
      <DonutPieChart
        title="Role & Privilege Authorization Mix"
        description="Headcount division across administration, operations, and collections"
        data={roleSegments}
        centerLabel="Members"
        centerValue={`${totalMembers}`}
      />

      <MultiBarChart
        title="Weekly Team Operations Throughput"
        description="NOC Provisioning Actions vs Cashier Payment Audits"
        data={weeklyActivityBars}
        primaryLabel="Provisioning Actions"
        secondaryLabel="Collections Logged"
      />
    </div>
  );
};
