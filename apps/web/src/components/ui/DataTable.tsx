'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { TableSkeletonRows } from './Skeleton';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;
  pageSize?: number;
  onRowClick?: (item: T) => void;
  actions?: React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display matching the criteria.',
  searchPlaceholder = 'Search records...',
  searchFilter,
  pageSize = 10,
  onRowClick,
  actions,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!searchFilter || !searchQuery.trim()) {
      return data;
    }
    return data.filter((item) => searchFilter(item, searchQuery.trim()));
  }, [data, searchFilter, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Adjust page if query changes and leaves page out of bounds
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-3">
      {/* Search and Action Toolbar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        {searchFilter ? (
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-border bg-surface py-2 pl-9 pr-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          {actions}
          <span className="text-xs text-neutral-500">
            Total: <span className="font-semibold text-neutral-800">{filteredData.length}</span>
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded border border-border bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-neutral-50 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={`px-4 py-3 ${col.headerClassName || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <TableSkeletonRows cols={columns.length} rows={pageSize > 5 ? 5 : pageSize} />
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-neutral-500">
                    <Inbox className="mx-auto h-7 w-7 stroke-1 text-neutral-400" />
                    <div className="mt-2 text-xs font-medium text-neutral-800">{emptyTitle}</div>
                    <div className="mt-0.5 text-[11px] text-neutral-500">{emptyDescription}</div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const key = keyExtractor(item);
                  return (
                    <tr
                      key={key}
                      onClick={() => onRowClick?.(item)}
                      className={`transition-colors hover:bg-neutral-50/60 ${
                        onRowClick ? 'cursor-pointer' : ''
                      }`}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                          {col.render
                            ? col.render(item, idx)
                            : (item as Record<string, any>)[col.key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {!isLoading && filteredData.length > pageSize && (
          <div className="flex items-center justify-between border-t border-border bg-neutral-50/50 px-4 py-2.5 text-xs text-neutral-600">
            <div>
              Showing{' '}
              <span className="font-semibold text-neutral-900">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-neutral-900">
                {Math.min(currentPage * pageSize, filteredData.length)}
              </span>{' '}
              of <span className="font-semibold text-neutral-900">{filteredData.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-7 w-7 items-center justify-center rounded border border-border bg-surface text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-2 text-[11px] font-medium text-neutral-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded border border-border bg-surface text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
