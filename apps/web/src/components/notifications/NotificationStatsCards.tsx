'use client';

import React from 'react';
import { MessageSquare, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { NotificationLogItem, NotificationTemplateItem } from './notifications.types';

interface NotificationStatsCardsProps {
  logs: NotificationLogItem[];
  templates: NotificationTemplateItem[];
}

export const NotificationStatsCards: React.FC<NotificationStatsCardsProps> = ({
  logs,
  templates,
}) => {
  const deliveredCount = logs.filter((l) => l.status === 'DELIVERED').length;
  const failedCount = logs.filter((l) => l.status === 'FAILED').length;
  const activeTemplatesCount = templates.filter((t) => t.isEnabled).length;

  const successRate = logs.length > 0 ? Math.round((deliveredCount / logs.length) * 100) : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total SMS */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Messages
          </span>
          <MessageSquare className="w-4 h-4 text-neutral-800" />
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">{logs.length}</div>
        <div className="text-xs text-neutral-500 mt-1">Logged outbound notifications</div>
      </div>

      {/* Delivered Rate */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Delivery Rate
          </span>
          <CheckCircle2 className="w-4 h-4 text-neutral-800" />
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">{successRate}%</div>
        <div className="text-xs text-neutral-500 mt-1">{deliveredCount} delivered successfully</div>
      </div>

      {/* Failed Count */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Delivery Failures
          </span>
          <AlertTriangle className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">{failedCount}</div>
        <div className="text-xs text-neutral-500 mt-1">Retry available on error</div>
      </div>

      {/* Active Templates */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Active Templates
          </span>
          <Layers className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">
          {activeTemplatesCount} / {templates.length}
        </div>
        <div className="text-xs text-neutral-500 mt-1">Configured automated triggers</div>
      </div>
    </div>
  );
};
