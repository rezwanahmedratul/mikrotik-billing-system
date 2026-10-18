'use client';

import React from 'react';
import { Database, Server, Cpu, Router as RouterIcon, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { SystemStatusData } from './settings.types';

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

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
      <div className="mb-5 flex items-center justify-between border-b border-neutral-100 pb-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">System Diagnostics & Core Daemons</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            Real-time infrastructure health and runtime dependencies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 font-mono text-[11px] text-neutral-600">
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
              className="flex items-start gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/40 p-3.5 transition hover:bg-neutral-50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-neutral-800 shadow-2xs">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="truncate text-xs font-semibold text-neutral-900">{sub.name}</div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                      sub.isOk
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    <span
                      className={`h-1 w-1 rounded-full ${
                        sub.isOk ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    />
                    <span>{sub.status}</span>
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500">{sub.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
