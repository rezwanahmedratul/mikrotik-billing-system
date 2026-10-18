'use client';

import React from 'react';
import Link from 'next/link';
import { Receipt, ExternalLink, Printer } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SubscriberDetail } from './subscribers.types';

interface SubscriberInvoicesTableProps {
  subscriber: SubscriberDetail;
}

export function SubscriberInvoicesTable({ subscriber }: SubscriberInvoicesTableProps) {
  const invoices = subscriber.invoices || [];

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-black p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Invoices & Receivables</h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Generated billing invoices, balance status, and settlement records
          </p>
        </div>
        <Link
          href="/dashboard/invoices"
          className="inline-flex items-center gap-1 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-black px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 shadow-2xs transition hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white"
        >
          <span>All Invoices</span>
          <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200/70 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/70 dark:bg-black text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Issued Date</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Paid Amount</th>
                <th className="px-4 py-3">Balance Due</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
                    No invoice statements found for this subscriber.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40">
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900 dark:text-white">
                      #{inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {new Date(inv.issuedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-neutral-900 dark:text-white">
                      {inv.totalFormatted}
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">
                      {inv.paidFormatted}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-neutral-900 dark:text-white">
                      {inv.balanceFormatted}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
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
