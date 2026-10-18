'use client';

import React from 'react';
import { Search, RefreshCw, Clock, Filter } from 'lucide-react';
import { RouterHealthItem } from './sessions.types';

interface SessionFiltersBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  routerFilter: string;
  onRouterChange: (r: string) => void;
  routers: RouterHealthItem[];
  autoRefreshInterval: number; // 0 = off, else seconds
  onAutoRefreshChange: (interval: number) => void;
  onRefresh: () => void;
  isLoading: boolean;
  freshnessNote?: string;
}

export function SessionFiltersBar({
  searchQuery,
  onSearchChange,
  routerFilter,
  onRouterChange,
  routers,
  autoRefreshInterval,
  onAutoRefreshChange,
  onRefresh,
  isLoading,
  freshnessNote,
}: SessionFiltersBarProps) {
  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by username, IP, subscriber name, or MAC..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50/70 border border-neutral-200 rounded-xl text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Router Gateway Selector */}
        {routers.length > 0 && (
          <select
            value={routerFilter}
            onChange={(e) => onRouterChange(e.target.value)}
            className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
          >
            <option value="ALL">All Gateways ({routers.length})</option>
            {routers.map((r) => (
              <option key={r.routerId} value={r.routerId}>
                {r.routerName} ({r.activeSessionsCount} active)
              </option>
            ))}
          </select>
        )}

        {/* Auto-refresh interval toggle */}
        <div className="inline-flex rounded-xl border border-neutral-200 p-1 bg-neutral-50">
          {[
            { label: 'Off', val: 0 },
            { label: '15s', val: 15 },
            { label: '30s', val: 30 },
            { label: '60s', val: 60 },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => onAutoRefreshChange(item.val)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                autoRefreshInterval === item.val
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Manual Poll Trigger */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 transition-colors disabled:opacity-50"
          title="Poll routers for fresh session telemetry"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Poll Now</span>
        </button>
      </div>
    </div>
  );
}
