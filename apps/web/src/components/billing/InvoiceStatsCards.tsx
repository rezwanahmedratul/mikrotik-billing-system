'use client';

import React from 'react';
import { Receipt, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { InvoiceItem } from './billing.types';

interface InvoiceStatsCardsProps {
  invoices: InvoiceItem[];
}

export function InvoiceStatsCards({ invoices }: InvoiceStatsCardsProps) {
  const totalBilledMinor = invoices.reduce((acc, inv) => acc + (inv.totalMinor || 0), 0);
  const totalCollectedMinor = invoices.reduce((acc, inv) => acc + (inv.paidAmountMinor || 0), 0);
  const totalOutstandingMinor = invoices.reduce((acc, inv) => acc + (inv.balanceMinor || 0), 0);
  const overdueCount = invoices.filter((inv) => inv.status === 'OVERDUE' || (inv.balanceMinor > 0 && new Date(inv.dueDate) < new Date())).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Billed */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs transition-all hover:border-neutral-300 dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
            Total Invoiced
          </span>
          <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-900 dark:text-white">
            <Receipt className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
          ৳ {(totalBilledMinor / 100).toFixed(2)}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{invoices.length} invoices generated</div>
      </div>

      {/* Collected Payments */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs transition-all hover:border-neutral-300 dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
            Total Collected
          </span>
          <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-900 dark:text-white">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
          ৳ {(totalCollectedMinor / 100).toFixed(2)}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Paid & settled revenue</div>
      </div>

      {/* Outstanding Due */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs transition-all hover:border-neutral-300 dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
            Outstanding Due
          </span>
          <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-900 dark:text-white">
            <Clock className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
          ৳ {(totalOutstandingMinor / 100).toFixed(2)}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Awaiting client settlement</div>
      </div>

      {/* Overdue Count */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs transition-all hover:border-neutral-300 dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
            Overdue Invoices
          </span>
          <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-900 dark:text-white">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{overdueCount}</div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {overdueCount > 0 ? 'Past grace period / due date' : 'All accounts current'}
        </div>
      </div>
    </div>
  );
}
