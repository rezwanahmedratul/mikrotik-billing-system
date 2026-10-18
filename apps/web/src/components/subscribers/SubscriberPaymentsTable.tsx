'use client';

import React from 'react';
import Link from 'next/link';
import { CreditCard, ExternalLink, Smartphone } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SubscriberDetail } from './subscribers.types';

interface SubscriberPaymentsTableProps {
  subscriber: SubscriberDetail;
}

export function SubscriberPaymentsTable({ subscriber }: SubscriberPaymentsTableProps) {
  const payments = subscriber.payments || [];

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Payment Collection History</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Confirmed cashier receipts, bKash, Nagad, and bank deposits
          </p>
        </div>
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center gap-1 rounded-xl border border-neutral-200/80 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-2xs transition hover:bg-neutral-50 hover:text-neutral-900"
        >
          <span>All Payments</span>
          <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-4 py-3">Receipt #</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Transaction Ref</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-neutral-400">
                    No payment collections recorded for this subscriber yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-neutral-50/60">
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                      #{p.paymentNumber}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {new Date(p.paidAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-700">
                      {p.amountFormatted}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-mono text-neutral-700">
                        {p.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-500">
                      {p.externalReference || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
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
