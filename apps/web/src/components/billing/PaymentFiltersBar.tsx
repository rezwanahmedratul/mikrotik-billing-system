'use client';

import React from 'react';
import { Search, RefreshCw, BarChart3 } from 'lucide-react';

interface PaymentFiltersBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  methodFilter: string;
  onMethodChange: (method: string) => void;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenReconciliation: () => void;
  onOpenWebhooksAudit?: () => void;
}

export const PaymentFiltersBar: React.FC<PaymentFiltersBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  methodFilter,
  onMethodChange,
  isLoading,
  onRefresh,
  onOpenReconciliation,
  onOpenWebhooksAudit,
}) => {
  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex flex-1 items-center gap-3 w-full">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by payment #, subscriber, phone, or TrxID..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50/70 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
          />
        </div>

        <select
          value={methodFilter}
          onChange={(e) => onMethodChange(e.target.value)}
          className="px-3 py-2 bg-neutral-50/70 border border-neutral-200 rounded-xl text-sm text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
        >
          <option value="ALL">All Methods</option>
          <option value="CASH">Cash</option>
          <option value="BKASH">bKash</option>
          <option value="NAGAD">Nagad</option>
          <option value="ROCKET">Rocket</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="CARD">Card / Online</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 bg-neutral-50/70 border border-neutral-200 rounded-xl text-sm text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
        >
          <option value="ALL">All Statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="REVERSED">Reversed</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 border border-neutral-200 text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-50 transition-colors"
          title="Refresh payments"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={onOpenReconciliation}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-800 text-sm font-medium rounded-xl transition-colors"
        >
          <BarChart3 className="w-4 h-4 text-neutral-500" />
          <span>Reconciliation</span>
        </button>

        {onOpenWebhooksAudit && (
          <button
            onClick={onOpenWebhooksAudit}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-900 hover:bg-black text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
          >
            <span>Gateway Webhooks</span>
          </button>
        )}
      </div>
    </div>
  );
};
