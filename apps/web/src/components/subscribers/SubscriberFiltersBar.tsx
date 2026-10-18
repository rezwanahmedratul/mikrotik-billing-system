'use client';

import React from 'react';
import { Search, RefreshCw, Filter } from 'lucide-react';

interface SubscriberFiltersBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  routerFilter: string;
  onRouterChange: (routerId: string) => void;
  routers: { id: string; name: string }[];
  onRefresh: () => void;
  isLoading: boolean;
}

export function SubscriberFiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  routerFilter,
  onRouterChange,
  routers,
  onRefresh,
  isLoading,
}: SubscriberFiltersBarProps) {
  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 dark:border-neutral-800 dark:bg-black">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 dark:text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, phone, account #, or PPPoE username..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50/60 border border-neutral-200/80 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 transition-colors focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-800 dark:bg-black dark:text-white dark:placeholder-neutral-500 dark:focus:border-white dark:focus:ring-white"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Status Pills */}
        <div className="inline-flex rounded-full border border-neutral-200/80 p-1 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-950">
          {['ALL', 'ACTIVE', 'SUSPENDED', 'EXPIRED'].map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                statusFilter === s
                  ? 'bg-neutral-900 text-white shadow-xs dark:bg-white dark:text-black'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
              }`}
            >
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Router Selector */}
        {routers.length > 0 && (
          <select
            value={routerFilter}
            onChange={(e) => onRouterChange(e.target.value)}
            className="px-3 py-2 bg-white border border-neutral-200/80 rounded-xl text-xs font-medium text-neutral-700 transition focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-800 dark:bg-black dark:text-neutral-200 dark:focus:border-white"
          >
            <option value="ALL">All Routers</option>
            {routers.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 border border-neutral-200/80 text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
          title="Refresh subscribers"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
