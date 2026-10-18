'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Radio,
  Router as RouterIcon,
  Receipt,
  Plus,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';

interface RouterSummary {
  id: string;
  name: string;
  ipAddress: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  cpuUsage: number;
  memoryUsage: number;
  activeSessions: number;
  lastSeen: string;
}

interface RecentActivity {
  id: string;
  action: string;
  entityType: string;
  user: string;
  timestamp: string;
}

export default function DashboardOverviewPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial operational mock/live state for demo & fast preview
  const [routers, setRouters] = useState<RouterSummary[]>([
    {
      id: 'rtr-1',
      name: 'Gulshan-Core-CCR2004',
      ipAddress: '192.168.88.1:8728',
      status: 'ONLINE',
      cpuUsage: 14,
      memoryUsage: 38,
      activeSessions: 184,
      lastSeen: 'Just now',
    },
    {
      id: 'rtr-2',
      name: 'Dhanmondi-POP-RB4011',
      ipAddress: '192.168.89.1:8728',
      status: 'ONLINE',
      cpuUsage: 22,
      memoryUsage: 45,
      activeSessions: 142,
      lastSeen: '1m ago',
    },
  ]);

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: 'act-1',
      action: 'PPPoE Session Bound: user-rahim (10.10.20.14)',
      entityType: 'PPPOE',
      user: 'Gulshan-Core-CCR2004',
      timestamp: '2 mins ago',
    },
    {
      id: 'act-2',
      action: 'Payment Received: ৳1,500 for INV-2026-10-001 via bKash',
      entityType: 'BILLING',
      user: 'salma (Cashier)',
      timestamp: '14 mins ago',
    },
    {
      id: 'act-3',
      action: 'Daily Billing Run generated 12 invoices',
      entityType: 'SYSTEM',
      user: 'Automated Worker',
      timestamp: '1 hour ago',
    },
    {
      id: 'act-4',
      action: 'Router Health Check completed for 2 routers',
      entityType: 'NETWORK',
      user: 'System Poll',
      timestamp: '2 hours ago',
    },
  ]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const totalSessions = routers.reduce((sum, r) => sum + r.activeSessions, 0);

  return (
    <AppShell
      title="Network & Billing Overview"
      description="Real-time ISP infrastructure health, active subscriber sessions, and collection telemetry."
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded border border-border bg-surface px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Telemetry</span>
          </button>
          <Link
            href="/dashboard/subscribers"
            className="flex items-center gap-1.5 rounded bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Subscriber</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Active Subscribers */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Active Subscribers</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">326</span>
              <span className="text-xs font-medium text-emerald-600">+12 this month</span>
            </div>
            <div className="mt-2 text-[11px] text-neutral-500">
              318 Active PPPoE &bull; 8 Pending Setup
            </div>
          </div>

          {/* Card 2: Online PPPoE Sessions */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Live PPPoE Sessions</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                <Radio className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">{totalSessions}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </div>
            <div className="mt-2 text-[11px] text-neutral-500">
              Across 2 RouterOS Gateways
            </div>
          </div>

          {/* Card 3: Routers Status */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Router Gateways</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                <RouterIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">
                {routers.filter((r) => r.status === 'ONLINE').length} / {routers.length}
              </span>
              <span className="text-xs font-medium text-neutral-600">100% Online</span>
            </div>
            <div className="mt-2 text-[11px] text-neutral-500">
              Avg CPU: 18% &bull; Health: Optimal
            </div>
          </div>

          {/* Card 4: Revenue & Collection */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Current Month Billed</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">৳245,800</span>
              <span className="text-xs font-medium text-emerald-600">৳198k Paid</span>
            </div>
            <div className="mt-2 text-[11px] text-neutral-500">
              80.5% Collected &bull; ৳47.8k Overdue
            </div>
          </div>
        </div>

        {/* Routers Inventory & Health Status */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">MikroTik Router Gateways</h2>
              <p className="text-xs text-neutral-500">
                Connected RouterOS devices executing PPPoE authentication, queues, and pool allocation
              </p>
            </div>
            <Link
              href="/dashboard/routers"
              className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <span>Manage Routers</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
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
              <tbody className="divide-y divide-neutral-100">
                {routers.map((router) => (
                  <tr key={router.id} className="transition-colors hover:bg-neutral-50/60">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      <div className="flex items-center gap-2">
                        <RouterIcon className="h-3.5 w-3.5 text-neutral-500" />
                        <span>{router.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-600">{router.ipAddress}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={router.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-neutral-800"
                            style={{ width: `${router.cpuUsage}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-neutral-700">
                          {router.cpuUsage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-neutral-800"
                            style={{ width: `${router.memoryUsage}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-neutral-700">
                          {router.memoryUsage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-neutral-900">
                      {router.activeSessions} online
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-neutral-500">
                      {router.lastSeen}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Two-Column Lower Section: Quick Operations & Recent Audit Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Quick Operations Panel */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs lg:col-span-1">
            <h2 className="text-sm font-semibold text-neutral-900">Quick Operations</h2>
            <p className="text-xs text-neutral-500">Frequently executed ISP actions</p>

            <div className="mt-4 space-y-2">
              <Link
                href="/dashboard/routers"
                className="flex items-center justify-between rounded-xl border border-neutral-200/80 p-3 transition hover:bg-neutral-50"
              >
                <div>
                  <div className="text-xs font-medium text-neutral-900">Add Router Gateway</div>
                  <div className="text-[11px] text-neutral-500">Configure new CCR or hEX device</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-neutral-400" />
              </Link>

              <Link
                href="/dashboard/subscribers"
                className="flex items-center justify-between rounded-xl border border-neutral-200/80 p-3 transition hover:bg-neutral-50"
              >
                <div>
                  <div className="text-xs font-medium text-neutral-900">Provision PPPoE User</div>
                  <div className="text-[11px] text-neutral-500">Create credentials and assign speed package</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-neutral-400" />
              </Link>

              <Link
                href="/dashboard/invoices"
                className="flex items-center justify-between rounded-xl border border-neutral-200/80 p-3 transition hover:bg-neutral-50"
              >
                <div>
                  <div className="text-xs font-medium text-neutral-900">Collect Payment</div>
                  <div className="text-[11px] text-neutral-500">Record cash, bKash, or bank deposit</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-neutral-400" />
              </Link>

              <Link
                href="/dashboard/staff"
                className="flex items-center justify-between rounded-xl border border-neutral-200/80 p-3 transition hover:bg-neutral-50"
              >
                <div>
                  <div className="text-xs font-medium text-neutral-900">Manage Staff Access</div>
                  <div className="text-[11px] text-neutral-500">Assign NOC operators and cashiers</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-neutral-400" />
              </Link>
            </div>
          </div>

          {/* Recent Operations & Audit Trail */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Recent Operations Trail</h2>
                <p className="text-xs text-neutral-500">
                  Audit events across router sync, billing runs, and network bindings
                </p>
              </div>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-mono text-neutral-600">Real-time log</span>
            </div>

            <div className="space-y-2.5">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start justify-between rounded-xl border border-neutral-200/70 bg-neutral-50/50 p-3.5 text-xs transition hover:bg-neutral-50"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-neutral-900">{act.action}</div>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                      <span className="rounded-full bg-neutral-200/70 px-2 py-0.2 font-mono text-[10px] text-neutral-700">
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
        </div>
      </div>
    </AppShell>
  );
}
