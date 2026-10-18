'use client';

import React from 'react';
import { Search, RefreshCw, CalendarDays, Plus } from 'lucide-react';

interface InvoiceFiltersBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (s: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function InvoiceFiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onRefresh,
  isLoading,
}: InvoiceFiltersBarProps) {
  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 dark:border-neutral-800 dark:bg-black">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 dark:text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by invoice #, client name, phone, or account #..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50/70 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors dark:border-neutral-800 dark:bg-black dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:ring-white"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Status Pills */}
        <div className="inline-flex rounded-full border border-neutral-200/80 p-1 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-950">
          {['ALL', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID'].map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                statusFilter === s
                  ? 'bg-neutral-900 text-white shadow-xs dark:bg-white dark:text-black'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 border border-neutral-200 text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
          title="Refresh invoices"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
