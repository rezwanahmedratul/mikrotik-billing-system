'use client';

import React from 'react';
import { Database, Server, Cpu, Router as RouterIcon, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { SystemStatusData } from './settings.types';
import { RadialProgressRing } from '@/components/charts/RadialProgressRing';

interface SystemDiagnosticsCardProps {
  system: SystemStatusData;
}

export function SystemDiagnosticsCard({ system }: SystemDiagnosticsCardProps) {
  const subsystems = [
    {
      name: 'PostgreSQL Database',
      detail: 'Relational DB with connection pooling & compound indexes',
      status: system.dbStatus,
      icon: Database,
      isOk: system.dbStatus === 'CONNECTED',
    },
    {
      name: 'Redis Cache & Pub/Sub',
      detail: 'In-memory telemetry caching & token revocation blacklist',
      status: system.redisStatus,
      icon: Server,
      isOk: system.redisStatus === 'CONNECTED',
    },
    {
      name: 'Background Worker Daemon',
      detail: 'Automated billing runs, grace period checks, and RouterOS health polls',
      status: system.workerStatus,
      icon: Cpu,
      isOk: system.workerStatus === 'ACTIVE',
    },
    {
      name: 'MikroTik RouterOS API',
      detail: `${system.activeRoutersCount} Gateways synchronized across API port 8728`,
      status: system.apiStatus,
      icon: RouterIcon,
      isOk: system.apiStatus === 'ONLINE',
    },
  ];

  const okCount = subsystems.filter((s) => s.isOk).length;
  const healthPct = Math.round((okCount / subsystems.length) * 100);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-black transition">
      <div className="mb-5 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">System Diagnostics & Core Daemons</h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Real-time infrastructure health and runtime dependencies
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RadialProgressRing
            percentage={healthPct}
            size={36}
            strokeWidth={4}
            color="currentColor"
          />
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 font-mono text-[11px] text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {system.platformVersion}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {subsystems.map((sub) => {
          const Icon = sub.icon;
          return (
            <div
              key={sub.name}
              className="flex items-start gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-black p-3.5 transition hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-white">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="truncate text-xs font-semibold text-neutral-900 dark:text-white">{sub.name}</div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-mono font-medium ${
                      sub.isOk
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'border border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
                    }`}
                  >
                    <span
                      className={`h-1 w-1 rounded-full ${
                        sub.isOk ? 'bg-white dark:bg-black' : 'bg-neutral-400'
                      }`}
                    />
                    <span>{sub.status}</span>
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">{sub.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
