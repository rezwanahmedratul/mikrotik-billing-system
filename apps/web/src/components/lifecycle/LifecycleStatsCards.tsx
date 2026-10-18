'use client';

import React from 'react';
import { Users, Ban, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';
import { ServiceReconciliationReport } from './lifecycle.types';

interface LifecycleStatsCardsProps {
  report: ServiceReconciliationReport | null;
  lastRunResult?: {
    suspended: number;
    restored: number;
    reminders: number;
    isDryRun: boolean;
  } | null;
}

export const LifecycleStatsCards: React.FC<LifecycleStatsCardsProps> = ({
  report,
  lastRunResult,
}) => {
  const activeCount = report?.activeCount ?? 0;
  const suspendedCount = report?.suspendedCount ?? 0;
  const discrepanciesCount = report?.discrepancies.length ?? 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Active Subscriptions */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Active Online
          </span>
          <Users className="w-4 h-4 text-neutral-800" />
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">{activeCount}</div>
        <div className="text-xs text-neutral-500 mt-1">Normal service status</div>
      </div>

      {/* Suspended Subscriptions */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Suspended (Cutoff)
          </span>
          <Ban className="w-4 h-4 text-neutral-800" />
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">{suspendedCount}</div>
        <div className="text-xs text-neutral-500 mt-1">Awaiting invoice payment</div>
      </div>

      {/* Recent Auto Restorations */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Auto Restorations
          </span>
          <RefreshCw className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">
          {lastRunResult ? lastRunResult.restored : 0}
        </div>
        <div className="text-xs text-neutral-500 mt-1">
          {lastRunResult?.isDryRun ? 'Projected in simulation' : 'Restored after settlement'}
        </div>
      </div>

      {/* Service Discrepancies */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Discrepancies
          </span>
          {discrepanciesCount === 0 ? (
            <ShieldCheck className="w-4 h-4 text-neutral-800" />
          ) : (
            <AlertCircle className="w-4 h-4 text-neutral-500" />
          )}
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">{discrepanciesCount}</div>
        <div className="text-xs text-neutral-500 mt-1">
          {discrepanciesCount === 0 ? 'All subscriptions reconciled' : 'Requires review'}
        </div>
      </div>
    </div>
  );
};
