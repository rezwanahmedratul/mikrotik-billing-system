'use client';

import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

interface PackageFiltersBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterArchived: 'all' | 'active' | 'archived';
  onFilterChange: (filter: 'all' | 'active' | 'archived') => void;
  activeCount: number;
  archivedCount: number;
  totalCount: number;
  onRefresh: () => void;
  isLoading: boolean;
}

export function PackageFiltersBar({
  searchQuery,
  onSearchChange,
  filterArchived,
  onFilterChange,
  activeCount,
  archivedCount,
  totalCount,
  onRefresh,
  isLoading,
}: PackageFiltersBarProps) {
  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by plan name, code, or profile..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50/60 border border-neutral-200/80 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 transition-colors focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-full border border-neutral-200/80 p-1 bg-neutral-50/80">
          <button
            onClick={() => onFilterChange('active')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
              filterArchived === 'active'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => onFilterChange('archived')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
              filterArchived === 'archived'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Archived ({archivedCount})
          </button>
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
              filterArchived === 'all'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            All ({totalCount})
          </button>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 border border-neutral-200/80 text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors"
          title="Refresh packages"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );
}
