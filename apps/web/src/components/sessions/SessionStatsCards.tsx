'use client';

import React from 'react';
import { Radio, ArrowUpRight, ArrowDownLeft, Server, AlertTriangle } from 'lucide-react';
import { SessionItem, RouterHealthItem } from './sessions.types';

interface SessionStatsCardsProps {
  sessions: SessionItem[];
  routersHealth: RouterHealthItem[];
  formattedTotalRx: string;
  formattedTotalTx: string;
}

export function SessionStatsCards({
  sessions,
  routersHealth,
  formattedTotalRx,
  formattedTotalTx,
}: SessionStatsCardsProps) {
  const onlineRouters = routersHealth.filter((r) => r.status === 'ONLINE').length;
  const degradedRouters = routersHealth.filter((r) => r.status === 'DEGRADED' || r.status === 'OFFLINE').length;
  const staleSessionsCount = sessions.filter((s) => s.isStale).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Active Sessions */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs transition-all hover:border-neutral-300 dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
            Active PPPoE Sessions
          </span>
          <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-900 dark:text-white">
            <Radio className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{sessions.length}</div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white animate-pulse"></span>
          <span>Live authenticated tunnels</span>
        </div>
      </div>

      {/* Aggregate Download (Tx) */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs transition-all hover:border-neutral-300 dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
            Total Download Traffic
          </span>
          <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-900 dark:text-white">
            <ArrowDownLeft className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
          {formattedTotalTx || '0 B'}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Aggregated client downlink (Tx)</div>
      </div>

      {/* Aggregate Upload (Rx) */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs transition-all hover:border-neutral-300 dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
            Total Upload Traffic
          </span>
          <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-900 dark:text-white">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
          {formattedTotalRx || '0 B'}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Aggregated client uplink (Rx)</div>
      </div>

      {/* Router Gateway Health */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs transition-all hover:border-neutral-300 dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider dark:text-neutral-400">
            Gateways in Sync
          </span>
          <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-900 dark:text-white">
            <Server className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
          {onlineRouters} / {routersHealth.length || 1}
        </div>
        <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {degradedRouters > 0 ? (
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {degradedRouters} gateway fallback to snapshot
            </span>
          ) : (
            <span>All routers polling live</span>
          )}
        </div>
      </div>
    </div>
  );
}
