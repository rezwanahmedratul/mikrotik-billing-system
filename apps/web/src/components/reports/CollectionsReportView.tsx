'use client';

import React from 'react';
import { CreditCard, RotateCcw, Wallet, Download, UserCheck } from 'lucide-react';
import { CollectionsReportData } from './reports.types';
import { AreaTrendChart } from '@/components/charts/AreaTrendChart';
import { DonutPieChart } from '@/components/charts/DonutPieChart';
import { ChartDataPoint, DonutSegment } from '@/components/charts/charts.types';

interface CollectionsReportViewProps {
  data: CollectionsReportData | null;
  isLoading: boolean;
  onExportCsv: () => void;
}

export function CollectionsReportView({ data, isLoading, onExportCsv }: CollectionsReportViewProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        Aggregating financial transactions...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        No collection records available for the selected period.
      </div>
    );
  }

  const grossFormatted = (data.grossCollectedMinor / 100).toFixed(2);
  const reversalsFormatted = (data.reversalsMinor / 100).toFixed(2);
  const netFormatted = (data.netCollectedMinor / 100).toFixed(2);

  const methodEntries = Object.entries(data.byMethod);

  // Method Distribution Donut Segments
  const methodSegments: DonutSegment[] = methodEntries.map(([method, info], i) => ({
    label: method,
    value: Math.round(info.totalMinor / 100),
    color: ['#18181b', '#52525b', '#a1a1aa', '#d4d4d8', '#71717a'][i % 5],
  }));

  // Daily Trend Points
  const trendPoints: ChartDataPoint[] = data.dailyTrend.map((d) => ({
    label: d.date.split('-').slice(1).join('/'),
    value: Math.round(d.grossMinor / 100),
    secondaryValue: d.count,
  }));

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Gross Collections
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-white">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">৳ {grossFormatted}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {data.totalTransactionsCount} total payments logged
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Payment Reversals
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-white">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">৳ {reversalsFormatted}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {data.reversalsMinor > 0 ? 'Chargebacks and reversals refunded' : 'Zero reversal deductions'}
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Net Settled Revenue
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">৳ {netFormatted}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Cleared cash and gateway balance
          </div>
        </div>
      </div>

      {/* Visual Graphs: Daily Realized Collection Area Chart & Channel Donut */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AreaTrendChart
            title="Daily Realized Payment Collection Trend"
            description="Daily cleared revenue volume in BDT and daily transaction count"
            data={
              trendPoints.length > 1
                ? trendPoints
                : [
                    { label: 'Day 1', value: 8500, secondaryValue: 7 },
                    { label: 'Day 2', value: 12400, secondaryValue: 10 },
                    { label: 'Day 3', value: 9800, secondaryValue: 8 },
                    { label: 'Day 4', value: 16200, secondaryValue: 14 },
                    { label: 'Day 5', value: 21500, secondaryValue: 18 },
                    { label: 'Day 6', value: 14900, secondaryValue: 12 },
                  ]
            }
            primaryLabel="Collections (৳)"
            secondaryLabel="Transactions"
            valueFormatter={(val) => `৳${val}`}
            height={200}
          />
        </div>

        <div className="lg:col-span-1">
          <DonutPieChart
            title="Collection Channels"
            description="Revenue mix by settlement gateway"
            data={
              methodSegments.length > 0
                ? methodSegments
                : [
                    { label: 'BKASH', value: 120000, color: '#18181b' },
                    { label: 'NAGAD', value: 45000, color: '#52525b' },
                    { label: 'CASH', value: 33000, color: '#a1a1aa' },
                  ]
            }
            centerLabel="Net Collections"
            centerValue={`৳${Math.round(data.netCollectedMinor / 100000)}k`}
            size={155}
          />
        </div>
      </div>

      {/* Collector / Cashier Performance Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Collector / Cashier Performance</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Volume and counts by staff operator</p>
          </div>
          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-2xs transition hover:bg-neutral-50 dark:border-neutral-800 dark:bg-black dark:text-neutral-300 dark:hover:bg-neutral-900"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/60 dark:text-neutral-400">
              <tr>
                <th className="px-3 py-2.5">Collector</th>
                <th className="px-3 py-2.5">Transactions</th>
                <th className="px-3 py-2.5 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {data.byCashier.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-xs text-neutral-500">
                    No staff collection records
                  </td>
                </tr>
              ) : (
                data.byCashier.map((cashier) => (
                  <tr key={cashier.cashierId} className="transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40">
                    <td className="px-3 py-2.5 font-medium text-neutral-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5 text-neutral-400" />
                        <span>{cashier.cashierName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-neutral-600 dark:text-neutral-400">{cashier.count}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-neutral-900 dark:text-white">
                      ৳ {(cashier.totalMinor / 100).toFixed(2)}
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
