'use client';

import React from 'react';
import { Users, Radio, Router as RouterIcon, Receipt, ArrowUpRight } from 'lucide-react';
import { DashboardMetrics } from './dashboard.types';

interface DashboardStatsCardsProps {
  metrics: DashboardMetrics;
}

export function DashboardStatsCards({ metrics }: DashboardStatsCardsProps) {
  const cards = [
    {
      title: 'Active Subscribers',
      value: metrics.activeSubscribers.toLocaleString(),
      subtext: metrics.subscribersDelta,
      detail: 'Assigned to active speed packages',
      icon: Users,
    },
    {
      title: 'Live PPPoE Sessions',
      value: metrics.onlineSessions.toLocaleString(),
      badge: { text: 'Live Sync', status: 'online' },
      detail: 'Across RouterOS core gateways',
      icon: Radio,
    },
    {
      title: 'Router Gateways',
      value: `${metrics.onlineRoutersCount} / ${metrics.totalRoutersCount}`,
      subtext: '100% Online',
      detail: 'Avg CPU: 18% • Latency < 5ms',
      icon: RouterIcon,
    },
    {
      title: 'Current Month Billed',
      value: metrics.currentMonthBilledFormatted,
      subtext: `${metrics.currentMonthPaidFormatted} Paid`,
      detail: `${metrics.collectionRate} collection rate`,
      icon: Receipt,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.title}
            className="group rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition-all hover:border-neutral-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                {c.title}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition group-hover:bg-neutral-900 group-hover:text-white">
                <Icon className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">
                {c.value}
              </span>
              {c.badge && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{c.badge.text}</span>
                </span>
              )}
              {c.subtext && (
                <span className="text-xs font-medium text-neutral-600">
                  {c.subtext}
                </span>
              )}
            </div>

            <div className="mt-2 text-[11px] text-neutral-400">
              {c.detail}
            </div>
          </div>
        );
      })}
    </div>
  );
}
