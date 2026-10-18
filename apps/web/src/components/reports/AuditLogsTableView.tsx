'use client';

import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ShieldCheck, User, Code, ChevronDown, ChevronUp } from 'lucide-react';
import { AuditLogItem, AuditLogListResponse } from './reports.types';

interface AuditLogsTableViewProps {
  data: AuditLogListResponse | null;
  isLoading: boolean;
  page: number;
  onPageChange: (newPage: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  actionFilter: string;
  onActionChange: (action: string) => void;
}

const AUDIT_ACTIONS = [
  'ALL',
  'USER_LOGIN',
  'USER_LOGOUT',
  'ROUTER_CREATED',
  'ROUTER_UPDATED',
  'ROUTER_DELETED',
  'PACKAGE_CREATED',
  'PACKAGE_UPDATED',
  'SUBSCRIBER_CREATED',
  'SUBSCRIBER_UPDATED',
  'PPPOE_PROVISIONED',
  'SERVICE_SUSPENDED',
  'SERVICE_RESTORED',
  'INVOICE_GENERATED',
  'PAYMENT_RECORDED',
  'PAYMENT_REVERSED',
  'CONFIG_CHANGED',
];

export function AuditLogsTableView({
  data,
  isLoading,
  page,
  onPageChange,
  searchQuery,
  onSearchChange,
  actionFilter,
  onActionChange,
}: AuditLogsTableViewProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  const items = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-4">
      {/* Search and Action Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-black">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by actor, entity ID, or details..."
            className="w-full pl-9 pr-4 py-2 bg-neutral-50/70 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:bg-white dark:focus:bg-black focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={actionFilter}
            onChange={(e) => onActionChange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white transition-colors"
          >
            <option value="ALL">All Audit Actions</option>
            {AUDIT_ACTIONS.filter((a) => a !== 'ALL').map((act) => (
              <option key={act} value={act}>
                {act.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Total Logs: <span className="font-semibold text-neutral-900 dark:text-white">{data?.total ?? 0}</span>
          </span>
        </div>
      </div>

      {/* Audit Logs Table Container */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs dark:border-neutral-800 dark:bg-black">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor / User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target Entity</th>
                <th className="px-4 py-3">IP / Client</th>
                <th className="px-4 py-3 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-500 dark:text-neutral-400">
                    Retrieving tamper-evident audit records...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-500 dark:text-neutral-400">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                items.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const dateStr = new Date(log.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40">
                        <td className="px-4 py-3 font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                          {dateStr}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                              <User className="h-3 w-3" />
                            </div>
                            <div>
                              <div className="font-medium text-neutral-900 dark:text-white">
                                {log.user?.fullName || 'System Automated'}
                              </div>
                              <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                                {log.user?.email || 'worker@platform'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-[10px] font-mono font-medium text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-medium text-neutral-800 dark:text-neutral-200">{log.entityType}</span>
                            <div className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[140px]">
                              {log.entityId}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
                          {log.ipAddress || '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {log.details ? (
                            <button
                              onClick={() => toggleExpand(log.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-700 hover:text-neutral-900 rounded-lg p-1 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-800 transition-colors"
                            >
                              <span>{isExpanded ? 'Hide' : 'Inspect'}</span>
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          ) : (
                            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">—</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && log.details && (
                        <tr className="bg-neutral-50/70 dark:bg-neutral-950">
                          <td colSpan={6} className="p-4">
                            <div className="rounded-xl border border-neutral-200/80 bg-neutral-900 dark:border-neutral-800 dark:bg-black p-3 font-mono text-[11px] text-neutral-200 overflow-x-auto">
                              <pre>{JSON.stringify(log.details, null, 2)}</pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/50 px-4 py-2.5 text-xs text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-400">
            <div>
              Page <span className="font-semibold text-neutral-900 dark:text-white">{page}</span> of{' '}
              <span className="font-semibold text-neutral-900 dark:text-white">{totalPages}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200/80 bg-white text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-800 dark:bg-black dark:text-neutral-300 dark:hover:bg-neutral-900"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-200/80 bg-white text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-800 dark:bg-black dark:text-neutral-300 dark:hover:bg-neutral-900"
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
