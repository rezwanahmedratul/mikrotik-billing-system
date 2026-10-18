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
    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-black p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Payment Collection History</h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Confirmed cashier receipts, bKash, Nagad, and bank deposits
          </p>
        </div>
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center gap-1 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-black px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 shadow-2xs transition hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white"
        >
          <span>All Payments</span>
          <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200/70 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-black text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              <tr>
                <th className="px-4 py-3">Receipt #</th>
                <th className="px-4 py-3">Payment Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Transaction Ref</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
                    No payment collections recorded for this subscriber yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40">
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900 dark:text-white">
                      #{p.paymentNumber}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {new Date(p.paidAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900 dark:text-white">
                      {p.amountFormatted}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 px-2 py-0.5 text-[10px] font-mono text-neutral-700 dark:text-neutral-300">
                        {p.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-500 dark:text-neutral-400">
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
