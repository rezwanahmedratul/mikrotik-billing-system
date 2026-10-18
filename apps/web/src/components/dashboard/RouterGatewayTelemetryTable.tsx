'use client';

import React from 'react';
import Link from 'next/link';
import { Router as RouterIcon, ArrowUpRight } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RouterSummary } from './dashboard.types';

interface RouterGatewayTelemetryTableProps {
  routers: RouterSummary[];
}

export function RouterGatewayTelemetryTable({ routers }: RouterGatewayTelemetryTableProps) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black transition-colors">
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">MikroTik Router Gateways</h2>
            <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-mono text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              {routers.length} nodes
            </span>
          </div>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Connected RouterOS devices executing PPPoE authentication, queues, and pool allocation
          </p>
        </div>
        <Link
          href="/dashboard/routers"
          className="inline-flex items-center gap-1 self-start rounded-xl border border-neutral-200/80 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-2xs transition hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white sm:self-auto"
        >
          <span>Manage Routers</span>
          <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200/70 dark:border-neutral-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-500">
              <tr>
                <th className="px-4 py-3">Router Name</th>
                <th className="px-4 py-3">API Address</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">CPU Load</th>
                <th className="px-4 py-3">Memory</th>
                <th className="px-4 py-3">PPPoE Sessions</th>
                <th className="px-4 py-3 text-right">Last Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {routers.map((router) => (
                <tr key={router.id} className="transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40">
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                        <RouterIcon className="h-3.5 w-3.5" />
                      </div>
                      <Link
                        href="/dashboard/routers"
                        className="font-medium text-neutral-900 hover:underline dark:text-white"
                      >
                        {router.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-400">{router.ipAddress}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={router.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-neutral-800 dark:bg-neutral-200 transition-all duration-300"
                          style={{ width: `${router.cpuUsage}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                        {router.cpuUsage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                        <div
                          className="h-full rounded-full bg-neutral-800 dark:bg-neutral-200 transition-all duration-300"
                          style={{ width: `${router.memoryUsage}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300">
                        {router.memoryUsage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-neutral-900 dark:text-white">
                    {router.activeSessions} online
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                    {router.lastSeen}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
