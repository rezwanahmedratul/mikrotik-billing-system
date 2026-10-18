'use client';

import React from 'react';
import { Package, Clock, ShieldCheck } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SubscriberDetail } from './subscribers.types';

interface SubscriberSubscriptionsTableProps {
  subscriber: SubscriberDetail;
}

export function SubscriberSubscriptionsTable({ subscriber }: SubscriberSubscriptionsTableProps) {
  const subscriptions = subscriber.subscriptions || [];

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-neutral-900">Subscription History & Plan Limits</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Tariff packages, speed allocations, and service validity timeframes
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-4 py-3">Broadband Plan</th>
                <th className="px-4 py-3">Bandwidth Limit</th>
                <th className="px-4 py-3">Recurring Rate</th>
                <th className="px-4 py-3">Billing Cycle</th>
                <th className="px-4 py-3">Validity Window</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-neutral-400">
                    No subscription records found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-neutral-50/60">
                    <td className="px-4 py-3 font-semibold text-neutral-900">
                      <div className="flex items-center gap-2">
                        <Package className="h-3.5 w-3.5 text-neutral-400" />
                        <span>{s.packageName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-700">{s.speedLimitRaw}</td>
                    <td className="px-4 py-3 font-mono font-medium text-neutral-900">{s.priceFormatted}</td>
                    <td className="px-4 py-3 capitalize text-neutral-600">{s.billingCycle.toLowerCase()}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px] text-neutral-600">
                        {new Date(s.startDate).toLocaleDateString()} &rarr; {new Date(s.expiryDate).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        {s.daysRemaining > 0 ? `${s.daysRemaining} days remaining` : 'Expired'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
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
