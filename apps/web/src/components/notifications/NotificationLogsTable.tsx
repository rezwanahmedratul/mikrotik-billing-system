'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { NotificationLogItem } from './notifications.types';

interface NotificationLogsTableProps {
  logs: NotificationLogItem[];
  isLoading: boolean;
  onRetry: (log: NotificationLogItem) => Promise<void>;
}

export const NotificationLogsTable: React.FC<NotificationLogsTableProps> = ({
  logs,
  isLoading,
  onRetry,
}) => {
  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xs overflow-hidden">
      <DataTable<NotificationLogItem>
        columns={[
          {
            key: 'recipient',
            header: 'Recipient / Dispatched',
            render: (l: NotificationLogItem) => (
              <div>
                <span className="font-mono font-bold text-neutral-900">+{l.recipientPhone}</span>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {l.sentAt ? new Date(l.sentAt).toLocaleString() : 'Queued'}
                </div>
              </div>
            ),
          },
          {
            key: 'message',
            header: 'Message Content',
            render: (l: NotificationLogItem) => (
              <div className="max-w-md">
                <p className="text-xs text-neutral-800 line-clamp-2 leading-relaxed">
                  {l.message}
                </p>
                {l.error && (
                  <div className="text-[11px] text-neutral-500 font-mono mt-1">
                    Error: {l.error}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'attempts',
            header: 'Attempts',
            render: (l: NotificationLogItem) => (
              <span className="text-xs font-mono text-neutral-600">
                {l.attempts} try{l.attempts === 1 ? '' : 'ies'}
              </span>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (l: NotificationLogItem) => (
              <StatusBadge
                status={l.status}
                variant={
                  l.status === 'DELIVERED'
                    ? 'success'
                    : l.status === 'FAILED'
                    ? 'error'
                    : 'warning'
                }
              />
            ),
          },
          {
            key: 'actions',
            header: 'Action',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (l: NotificationLogItem) => (
              <div className="flex items-center justify-end">
                {l.status === 'FAILED' && (
                  <button
                    onClick={() => onRetry(l)}
                    className="px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-black bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors flex items-center gap-1.5"
                    title="Retry dispatching SMS"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                )}
              </div>
            ),
          },
        ]}
        data={logs}
        keyExtractor={(l) => l.id}
        isLoading={isLoading}
        emptyTitle="No notification logs found"
        emptyDescription="There are no outbound SMS messages matching your criteria."
      />
    </div>
  );
};
