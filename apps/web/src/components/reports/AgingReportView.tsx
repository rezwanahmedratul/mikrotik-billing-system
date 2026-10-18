'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, AlertTriangle, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { AgingReportData } from './reports.types';
import { MultiBarChart } from '@/components/charts/MultiBarChart';
import { DonutPieChart } from '@/components/charts/DonutPieChart';
import { ChartDataPoint, DonutSegment } from '@/components/charts/charts.types';

interface AgingReportViewProps {
  data: AgingReportData | null;
  isLoading: boolean;
}

export function AgingReportView({ data, isLoading }: AgingReportViewProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        Calculating invoice aging schedules...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        No outstanding invoice balances found.
      </div>
    );
  }

  const { buckets, topDebtors } = data;
  const totalOutstandingFormatted = (data.totalOutstandingMinor / 100).toFixed(2);

  // Aging Bracket Bar Chart
  const bucketBars: ChartDataPoint[] = [
    { label: 'Current (<1d)', value: Math.round(buckets.current.totalMinor / 100), secondaryValue: buckets.current.count },
    { label: '1-30 Days', value: Math.round(buckets.days1to30.totalMinor / 100), secondaryValue: buckets.days1to30.count },
    { label: '31-60 Days', value: Math.round(buckets.days31to60.totalMinor / 100), secondaryValue: buckets.days31to60.count },
    { label: '61-90 Days', value: Math.round(buckets.days61to90.totalMinor / 100), secondaryValue: buckets.days61to90.count },
    { label: '90+ Days', value: Math.round(buckets.days90Plus.totalMinor / 100), secondaryValue: buckets.days90Plus.count },
  ];

  // Donut Segments
  const bucketSegments: DonutSegment[] = [
    { label: 'Current', value: Math.max(1, Math.round(buckets.current.totalMinor / 100)), color: '#e4e4e7' },
    { label: '1-30 Days', value: Math.max(1, Math.round(buckets.days1to30.totalMinor / 100)), color: '#a1a1aa' },
    { label: '31-60 Days', value: Math.max(1, Math.round(buckets.days31to60.totalMinor / 100)), color: '#71717a' },
    { label: '61-90 Days', value: Math.max(1, Math.round(buckets.days61to90.totalMinor / 100)), color: '#52525b' },
    { label: '90+ Days', value: Math.max(1, Math.round(buckets.days90Plus.totalMinor / 100)), color: '#27272a' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Total Outstanding Receivables
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-neutral-900 dark:text-white">
              ৳ {totalOutstandingFormatted}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              Across {data.totalOverdueCount} overdue invoices
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/lifecycle"
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-neutral-50 px-3.5 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <Clock className="h-3.5 w-3.5 text-neutral-500" />
            <span>Service Lifecycle & Grace</span>
          </Link>
        </div>
      </div>

      {/* Visual Aging Charts: Overdue Aging Bar Chart & Proportions Donut */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MultiBarChart
          title="Aging Debtors Schedule"
          description="Receivables distribution grouped by delinquency timeframe"
          data={bucketBars}
          primaryLabel="Overdue Amount (৳)"
          secondaryLabel="Invoice Count"
          valueFormatter={(val) => `৳${val}`}
          height={200}
        />

        <DonutPieChart
          title="Delinquency Risk Exposure"
          description="Proportion of total outstanding balance across aging categories"
          data={bucketSegments}
          centerLabel="Overdue"
          centerValue={`৳${Math.round(data.totalOutstandingMinor / 100000)}k`}
          size={165}
        />
      </div>

      {/* Top Delinquent Debtors Table */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">High-Exposure Accounts (Top Debtors)</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Subscribers with greatest overdue balances</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-2.5">Subscriber Account</th>
                <th className="px-3 py-2.5">Contact Phone</th>
                <th className="px-3 py-2.5">Unpaid Invoices</th>
                <th className="px-3 py-2.5">Longest Overdue</th>
                <th className="px-3 py-2.5 text-right">Outstanding Balance</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {topDebtors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-neutral-500">
                    No delinquent subscriber debtors found.
                  </td>
                </tr>
              ) : (
                topDebtors.map((debtor) => (
                  <tr key={debtor.subscriberId} className="transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                    <td className="px-3 py-2.5 font-medium text-neutral-900 dark:text-white">
                      <div>
                        <span>{debtor.subscriberName}</span>
                        <div className="text-[10px] font-mono text-neutral-400">{debtor.accountNumber}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-neutral-600 dark:text-neutral-400">{debtor.phone}</td>
                    <td className="px-3 py-2.5 font-mono font-medium text-neutral-800 dark:text-neutral-200">
                      {debtor.invoiceCount} invoices
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[10px] font-mono font-medium text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                        {debtor.daysOverdue} days
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-neutral-900 dark:text-white">
                      ৳ {(debtor.balanceMinor / 100).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link
                        href={`/dashboard/subscribers/${debtor.subscriberId}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-black dark:text-neutral-300 dark:hover:bg-neutral-900"
                      >
                        <span>Profile</span>
                        <ArrowUpRight className="h-3 w-3 text-neutral-400" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
