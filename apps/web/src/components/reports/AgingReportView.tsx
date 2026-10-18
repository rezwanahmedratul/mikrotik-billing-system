'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, AlertTriangle, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { AgingReportData } from './reports.types';

interface AgingReportViewProps {
  data: AgingReportData | null;
  isLoading: boolean;
}

export function AgingReportView({ data, isLoading }: AgingReportViewProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center text-xs text-neutral-500">
        Calculating invoice aging schedules...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center text-xs text-neutral-500">
        No outstanding invoice balances found.
      </div>
    );
  }

  const { buckets, topDebtors } = data;

  const totalOutstandingFormatted = (data.totalOutstandingMinor / 100).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Outstanding Receivables
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-neutral-900">
              ৳ {totalOutstandingFormatted}
            </span>
            <span className="text-xs text-amber-600 font-medium">
              Across {data.totalOverdueCount} overdue invoices
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/lifecycle"
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-neutral-50 px-3.5 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            <Clock className="h-3.5 w-3.5 text-neutral-500" />
            <span>Service Lifecycle & Grace</span>
          </Link>
        </div>
      </div>

      {/* 5 Aging Buckets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Current (Not overdue) */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Current (Within Due)
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-neutral-900">
            ৳ {(buckets.current.totalMinor / 100).toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-neutral-500">{buckets.current.count} invoices</div>
        </div>

        {/* 1 - 30 Days Overdue */}
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
            1 – 30 Days Past Due
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-amber-900">
            ৳ {(buckets.days1to30.totalMinor / 100).toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-amber-700 font-medium">
            {buckets.days1to30.count} invoices
          </div>
        </div>

        {/* 31 - 60 Days Overdue */}
        <div className="rounded-2xl border border-orange-200/80 bg-orange-50/30 p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-800">
            31 – 60 Days Past Due
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-orange-900">
            ৳ {(buckets.days31to60.totalMinor / 100).toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-orange-700 font-medium">
            {buckets.days31to60.count} invoices
          </div>
        </div>

        {/* 61 - 90 Days Overdue */}
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/30 p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-800">
            61 – 90 Days Past Due
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-rose-900">
            ৳ {(buckets.days61to90.totalMinor / 100).toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-rose-700 font-medium">
            {buckets.days61to90.count} invoices
          </div>
        </div>

        {/* 90+ Days Overdue */}
        <div className="rounded-2xl border border-rose-300 bg-rose-100/40 p-4 shadow-xs">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-900">
            90+ Days Bad Debt
          </div>
          <div className="mt-2 text-lg font-bold font-mono text-rose-950">
            ৳ {(buckets.days90Plus.totalMinor / 100).toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-rose-800 font-medium">
            {buckets.days90Plus.count} invoices
          </div>
        </div>
      </div>

      {/* Top Outstanding Accounts Table */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-neutral-900">High-Exposure Subscriber Accounts</h3>
          <p className="text-xs text-neutral-500">
            Clients with the highest unpaid balances ranked by outstanding risk
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Subscriber</th>
                <th className="px-4 py-3">Account #</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Unpaid Invoices</th>
                <th className="px-4 py-3">Aging Delay</th>
                <th className="px-4 py-3 text-right">Outstanding Balance</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {topDebtors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                    All accounts are in good standing!
                  </td>
                </tr>
              ) : (
                topDebtors.map((debtor) => (
                  <tr key={debtor.subscriberId} className="transition-colors hover:bg-neutral-50/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {debtor.subscriberName}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-600">{debtor.accountNumber}</td>
                    <td className="px-4 py-3 font-mono text-neutral-500">{debtor.phone}</td>
                    <td className="px-4 py-3 font-mono">{debtor.invoiceCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          debtor.daysOverdue > 30
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : debtor.daysOverdue > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {debtor.daysOverdue > 0 ? `${debtor.daysOverdue}d overdue` : 'Current'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-neutral-900">
                      ৳ {(debtor.balanceMinor / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/subscribers/${debtor.subscriberId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-700 hover:text-neutral-900"
                      >
                        <span>View</span>
                        <ArrowUpRight className="h-3 w-3" />
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
