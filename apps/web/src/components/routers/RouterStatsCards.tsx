import React from 'react';
import { Network, Activity, Users, Cpu } from 'lucide-react';
import { RouterItem } from './routers.types';

interface RouterStatsCardsProps {
  routers: RouterItem[];
}

export function RouterStatsCards({ routers }: RouterStatsCardsProps) {
  const totalRouters = routers.length;
  const onlineRouters = routers.filter((r) => r.connectionStatus === 'ONLINE').length;
  const offlineRouters = routers.filter((r) => r.connectionStatus === 'OFFLINE').length;
  const totalSessions = routers.reduce((sum, r) => sum + (r.activeSessionsCount || 0), 0);

  const routersWithCpu = routers.filter((r) => r.cpuLoad !== null);
  const avgCpu =
    routersWithCpu.length > 0
      ? Math.round(
          routersWithCpu.reduce((sum, r) => sum + (r.cpuLoad || 0), 0) / routersWithCpu.length
        )
      : null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Gateways */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Gateways
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
            <Network className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            {totalRouters}
          </span>
          <span className="text-xs text-neutral-500">routers</span>
        </div>
        <div className="mt-2 text-[11px] text-neutral-500">
          Hardware & virtual cloud RouterOS
        </div>
      </div>

      {/* Connection Status */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Online Fleet Health
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            {onlineRouters}
          </span>
          <span className="text-xs text-neutral-500">/ {totalRouters} online</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px]">
          {offlineRouters > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse"></span>
              {offlineRouters} offline
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
              100% gateways reachable
            </span>
          )}
        </div>
      </div>

      {/* Live PPPoE Sessions */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Active PPPoE Sessions
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            {totalSessions.toLocaleString()}
          </span>
          <span className="text-xs text-neutral-500">tunnels</span>
        </div>
        <div className="mt-2 text-[11px] text-neutral-500">
          Aggregated across online gateways
        </div>
      </div>

      {/* Fleet CPU Utilization */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Fleet Avg CPU Load
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
            <Cpu className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            {avgCpu !== null ? `${avgCpu}%` : '—'}
          </span>
          <span className="text-xs text-neutral-500">load</span>
        </div>
        <div className="mt-2 text-[11px] text-neutral-500">
          {avgCpu !== null && avgCpu < 60
            ? 'Operating in optimal capacity envelope'
            : 'Telemetry updated via background poller'}
        </div>
      </div>
    </div>
  );
}
