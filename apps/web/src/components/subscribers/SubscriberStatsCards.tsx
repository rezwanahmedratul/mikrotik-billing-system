'use client';

import React from 'react';
import { Users, UserCheck, UserX, AlertTriangle } from 'lucide-react';
import { SubscriberItem } from './subscribers.types';

interface SubscriberStatsCardsProps {
  subscribers: SubscriberItem[];
  totalCount: number;
}

export function SubscriberStatsCards({ subscribers, totalCount }: SubscriberStatsCardsProps) {
  const activeCount = subscribers.filter(
    (s) => s.currentSubscription?.status === 'ACTIVE'
  ).length;

  const suspendedCount = subscribers.filter(
    (s) => s.currentSubscription?.status === 'SUSPENDED' || s.pppoeAccount?.isSuspended
  ).length;

  const expiredCount = subscribers.filter(
    (s) => s.currentSubscription?.status === 'EXPIRED' || (s.currentSubscription?.daysRemaining ?? 1) <= 0
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Accounts
          </span>
          <Users className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-bold text-neutral-900">{totalCount || subscribers.length}</div>
        <div className="text-xs text-neutral-500 mt-1">Registered ISP subscribers</div>
      </div>

      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Active Service
          </span>
          <UserCheck className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold text-neutral-900">{activeCount}</div>
        <div className="text-xs text-emerald-600 font-medium mt-1">Online with valid subscription</div>
      </div>

      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Suspended
          </span>
          <UserX className="w-4 h-4 text-rose-500" />
        </div>
        <div className="text-2xl font-bold text-neutral-900">{suspendedCount}</div>
        <div className="text-xs text-rose-500 font-medium mt-1">Cut off or disabled on router</div>
      </div>

      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs transition hover:shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Expiring / Expired
          </span>
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        </div>
        <div className="text-2xl font-bold text-neutral-900">{expiredCount}</div>
        <div className="text-xs text-amber-600 font-medium mt-1">Renewal action needed</div>
      </div>
    </div>
  );
}
