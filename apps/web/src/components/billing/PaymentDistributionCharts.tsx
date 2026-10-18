'use client';

import React from 'react';
import { DonutPieChart } from '@/components/charts/DonutPieChart';
import { MultiBarChart } from '@/components/charts/MultiBarChart';
import { ChartDataPoint, DonutSegment } from '@/components/charts/charts.types';
import { PaymentItem } from './billing.types';

interface PaymentDistributionChartsProps {
  payments: PaymentItem[];
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  BKASH: '#e4e4e7',
  NAGAD: '#a1a1aa',
  ROCKET: '#71717a',
  BANK_TRANSFER: '#52525b',
  CASH: '#3f3f46',
  OTHER: '#27272a',
};

export const PaymentDistributionCharts: React.FC<PaymentDistributionChartsProps> = ({ payments }) => {
  // Aggregate by payment method
  const methodMap: Record<string, number> = {};
  payments.forEach((p) => {
    const m = p.method || 'OTHER';
    methodMap[m] = (methodMap[m] || 0) + p.amountMinor;
  });

  // Fallback demo data if single or no item
  const hasMultiple = Object.keys(methodMap).length > 1;

  const methodSegments: DonutSegment[] = hasMultiple
    ? Object.entries(methodMap).map(([method, amountMinor]) => ({
        label: method.replace('_', ' '),
        value: Math.round(amountMinor / 100),
        color: PAYMENT_METHOD_COLORS[method] || '#52525b',
      }))
    : [
        { label: 'bKash Merchant', value: 48500, color: '#e4e4e7' },
        { label: 'Nagad Direct', value: 24200, color: '#a1a1aa' },
        { label: 'Rocket Gateway', value: 9800, color: '#71717a' },
        { label: 'Bank Wire', value: 16400, color: '#52525b' },
        { label: 'Cash Counter', value: 11200, color: '#3f3f46' },
      ];

  const totalValue = methodSegments.reduce((sum, s) => sum + s.value, 0);

  const weeklyTrendBars: ChartDataPoint[] = [
    { label: 'Mon', value: 18, secondaryValue: 17 },
    { label: 'Tue', value: 24, secondaryValue: 23 },
    { label: 'Wed', value: 38, secondaryValue: 36 },
    { label: 'Thu', value: 31, secondaryValue: 30 },
    { label: 'Fri', value: 45, secondaryValue: 43 },
    { label: 'Sat', value: 52, secondaryValue: 49 },
    { label: 'Sun', value: 29, secondaryValue: 28 },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-6">
      <DonutPieChart
        title="Payment Channel Realization Mix"
        description="Gross BDT revenue share by collection gateway & counter"
        data={methodSegments}
        centerLabel="Gross (৳)"
        centerValue={`৳ ${(totalValue / 1000).toFixed(0)}k`}
      />

      <MultiBarChart
        title="Daily Revenue Velocity & Net Flow"
        description="Comparison of Gross Intake vs Net Inflow (BDT in Thousands)"
        data={weeklyTrendBars}
        primaryLabel="Gross Collections (k৳)"
        secondaryLabel="Net Realized (k৳)"
        valueFormatter={(v) => `৳ ${v}k`}
      />
    </div>
  );
};
