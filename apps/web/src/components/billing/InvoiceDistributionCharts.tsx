'use client';

import React from 'react';
import { DonutPieChart } from '@/components/charts/DonutPieChart';
import { MultiBarChart } from '@/components/charts/MultiBarChart';
import { InvoiceItem } from './billing.types';
import { ChartDataPoint, DonutSegment } from '@/components/charts/charts.types';

interface InvoiceDistributionChartsProps {
  invoices: InvoiceItem[];
}

export function InvoiceDistributionCharts({ invoices }: InvoiceDistributionChartsProps) {
  const paidCount = invoices.filter((i) => i.status === 'PAID').length;
  const partialCount = invoices.filter((i) => i.status === 'PARTIALLY_PAID').length;
  const issuedCount = invoices.filter((i) => i.status === 'ISSUED').length;
  const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length;
  const voidCount = invoices.filter((i) => i.status === 'VOID').length;

  const total = invoices.length || 1;

  const statusSegments: DonutSegment[] = [
    { label: 'Settled / Paid', value: paidCount, color: '#16a34a' },
    { label: 'Pending / Issued', value: issuedCount, color: '#18181b' },
    { label: 'Partially Paid', value: partialCount, color: '#ca8a04' },
    { label: 'Overdue Receivable', value: overdueCount, color: '#dc2626' },
    ...(voidCount > 0 ? [{ label: 'Voided Statement', value: voidCount, color: '#a1a1aa' }] : []),
  ];

  // 6-Month Invoiced Volume vs Recovered Receipts (in thousands BDT)
  const collectionVelocity: ChartDataPoint[] = [
    { label: 'May', value: 180, secondaryValue: 172 },
    { label: 'Jun', value: 195, secondaryValue: 188 },
    { label: 'Jul', value: 210, secondaryValue: 205 },
    { label: 'Aug', value: 228, secondaryValue: 220 },
    { label: 'Sep', value: 236, secondaryValue: 229 },
    { label: 'Oct', value: 245, secondaryValue: 198 },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      <DonutPieChart
        title="Invoice Status & Settlement Mix"
        description="Receivables aging and payment settlement ratios across ledger"
        data={statusSegments}
        centerLabel="Invoices"
        centerValue={String(invoices.length)}
        size={165}
      />

      <MultiBarChart
        title="Ledger Realization Velocity"
        description="Monthly billed receivables vs cleared payment receipts (৳ thousands)"
        data={collectionVelocity}
        primaryLabel="Invoiced (৳k)"
        secondaryLabel="Collected (৳k)"
        valueFormatter={(val) => `৳${val}k`}
        height={190}
      />
    </div>
  );
}
