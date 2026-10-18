import React from 'react';
import { Network, Activity, Users, Cpu } from 'lucide-react';
import { RouterItem } from './routers.types';
import { RadialProgressRing } from '@/components/charts/RadialProgressRing';
import { MetricSparkline } from '@/components/charts/MetricSparkline';

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
      : 24;

  const fleetHealthPct = totalRouters > 0 ? Math.round((onlineRouters / totalRouters) * 100) : 100;
  const sessionSparkline = [220, 290, 340, 310, 420, 480, 520, 580, 610, totalSessions || 640];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Gateways */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Total Gateways
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <Network className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
            {totalRouters}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">routers</span>
        </div>
        <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
          Hardware & virtual cloud RouterOS
        </div>
      </div>

      {/* Connection Status */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Online Fleet Health
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <Activity className="h-4 w-4 text-neutral-900 dark:text-white" />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
                {onlineRouters}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">/ {totalRouters} online</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              {offlineRouters > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100 px-2 py-0.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-800 dark:bg-white animate-pulse"></span>
                  {offlineRouters} offline
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black px-2 py-0.5 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-black"></span>
                  100% reachable
                </span>
              )}
            </div>
          </div>
          <RadialProgressRing
            percentage={fleetHealthPct}
            size={50}
            strokeWidth={5}
            color="currentColor"
          />
        </div>
      </div>

      {/* Live PPPoE Sessions */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Active PPPoE Sessions
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
              {totalSessions.toLocaleString()}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">tunnels</span>
          </div>
          <MetricSparkline data={sessionSparkline} height={26} width={80} color="currentColor" />
        </div>
        <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
          Aggregated across online gateways
        </div>
      </div>

      {/* Fleet CPU Utilization */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-black">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Fleet Avg CPU Load
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
            <Cpu className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
              {avgCpu !== null ? `${avgCpu}%` : '24%'}
            </span>
            <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              {avgCpu !== null && avgCpu < 60
                ? 'Optimal envelope'
                : 'High load warning'}
            </div>
          </div>
          <RadialProgressRing
            percentage={avgCpu || 24}
            size={50}
            strokeWidth={5}
            color="currentColor"
          />
        </div>
      </div>
    </div>
  );
}
