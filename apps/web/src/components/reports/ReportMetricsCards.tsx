'use client';

import React from 'react';
import { CreditCard, AlertCircle, Users, Router as RouterIcon, Clock } from 'lucide-react';
import { DashboardOverviewData } from './reports.types';

interface ReportMetricsCardsProps {
  overview: DashboardOverviewData | null;
  isLoading: boolean;
}

export function ReportMetricsCards({ overview, isLoading }: ReportMetricsCardsProps) {
  const m = overview?.metrics;

  const currentMonthPaid = m ? (m.currentMonthPaidMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00';
  const outstandingDue = m ? (m.outstandingDueMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Net Collections */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Monthly Collections
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
            <CreditCard className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">
          ৳ {isLoading ? '...' : currentMonthPaid}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Settled in current billing cycle</span>
        </div>
      </div>

      {/* Outstanding Overdue */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Outstanding Balance
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-amber-600">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">
          ৳ {isLoading ? '...' : outstandingDue}
        </div>
        <div className="mt-1 text-xs text-neutral-500">
          {m?.overdueInvoicesCount ?? 0} invoices past due date
        </div>
      </div>

      {/* Subscribers Active */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Subscriber Pool
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">
          {isLoading ? '...' : m?.totalSubscribers ?? 0}
        </div>
        <div className="mt-1 text-xs text-neutral-500">
          {m?.activeSubscribers ?? 0} active &bull; {m?.suspendedSubscribers ?? 0} suspended
        </div>
      </div>

      {/* Router Gateways */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Infrastructure Health
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
            <RouterIcon className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">
          {isLoading ? '...' : `${m?.onlineRouters ?? 0} / ${m?.totalRouters ?? 0}`}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
          <Clock className="h-3 w-3 text-neutral-400" />
          <span>{overview?.dataFreshness.isCached ? 'Cached telemetry snapshot' : 'Real-time telemetry'}</span>
        </div>
      </div>
    </div>
  );
}
