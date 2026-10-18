'use client';

import React from 'react';
import { MessageSquare, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { NotificationLogItem, NotificationTemplateItem } from './notifications.types';
import { RadialProgressRing } from '@/components/charts/RadialProgressRing';
import { MetricSparkline } from '@/components/charts/MetricSparkline';

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

  const successRate = logs.length > 0 ? Math.round((deliveredCount / logs.length) * 100) : 98;
  const mockSparkline = [12, 19, 25, 22, 34, 48, 55, 62, 70, logs.length || 78];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total SMS */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black transition hover:border-neutral-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Total Messages
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <MessageSquare className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline justify-between mt-2">
          <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{logs.length}</div>
          <MetricSparkline data={mockSparkline} height={26} width={80} color="currentColor" />
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Logged outbound notifications</div>
      </div>

      {/* Delivered Rate */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black transition hover:border-neutral-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Delivery Rate
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <CheckCircle2 className="h-4 w-4 text-neutral-900 dark:text-white" />
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{successRate}%</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{deliveredCount} delivered successfully</div>
          </div>
          <RadialProgressRing
            percentage={successRate}
            size={52}
            strokeWidth={5}
            color="currentColor"
          />
        </div>
      </div>

      {/* Failed Count */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black transition hover:border-neutral-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Delivery Failures
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <AlertTriangle className="h-4 w-4 text-neutral-900 dark:text-white" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{failedCount}</div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          {failedCount > 0 ? 'Retry available on error' : 'All dispatch attempts cleared'}
        </div>
      </div>

      {/* Active Templates */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black transition hover:border-neutral-300">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Active Templates
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <Layers className="h-4 w-4 text-neutral-900 dark:text-white" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
          {activeTemplatesCount} / {templates.length}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Configured automated triggers</div>
      </div>
    </div>
  );
};
