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
    <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, phone, account #, or PPPoE username..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Status Pills */}
        <div className="inline-flex rounded-lg border border-neutral-200 p-1 bg-neutral-50">
          {['ALL', 'ACTIVE', 'SUSPENDED', 'EXPIRED'].map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === s
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
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
            className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900"
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
          className="p-2 border border-neutral-200 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-50 transition-colors"
          title="Refresh subscribers"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
