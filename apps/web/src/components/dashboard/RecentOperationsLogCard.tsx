'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { RecentActivity } from './dashboard.types';

interface RecentOperationsLogCardProps {
  activities: RecentActivity[];
}

export function RecentOperationsLogCard({ activities }: RecentOperationsLogCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900">Recent Operations Trail</h2>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-mono text-neutral-600">
              Live audit
            </span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">
            Real-time events across router sync, billing runs, and network bindings
          </p>
        </div>
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-1 rounded-xl border border-neutral-200/80 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-2xs transition hover:bg-neutral-50 hover:text-neutral-900"
        >
          <span>Audit Log</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {activities.map((act) => (
          <div
            key={act.id}
            className="flex items-start justify-between rounded-xl border border-neutral-200/70 bg-neutral-50/40 p-3.5 text-xs transition hover:bg-neutral-50"
          >
            <div className="space-y-1">
              <div className="font-medium text-neutral-900">{act.action}</div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                <span className="rounded-full bg-neutral-200/80 px-2 py-0.2 font-mono text-[10px] font-medium text-neutral-700">
                  {act.entityType}
                </span>
                <span>Initiator: {act.user}</span>
              </div>
            </div>
            <span className="shrink-0 font-mono text-[11px] text-neutral-400">
              {act.timestamp}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
