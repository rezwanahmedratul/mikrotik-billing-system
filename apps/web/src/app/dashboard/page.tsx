'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import {
  RouterSummary,
  RecentActivity,
  DashboardMetrics,
} from '@/components/dashboard/dashboard.types';
import { DashboardStatsCards } from '@/components/dashboard/DashboardStatsCards';
import { DashboardChartsSection } from '@/components/dashboard/DashboardChartsSection';
import { RouterGatewayTelemetryTable } from '@/components/dashboard/RouterGatewayTelemetryTable';
import { QuickOperationsCard } from '@/components/dashboard/QuickOperationsCard';
import { RecentOperationsLogCard } from '@/components/dashboard/RecentOperationsLogCard';

export default function DashboardOverviewPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Operational state
  const [routers] = useState<RouterSummary[]>([
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

  const totalSessions = routers.reduce((sum, r) => sum + r.activeSessions, 0);

  const metrics: DashboardMetrics = {
    activeSubscribers: 326,
    subscribersDelta: '+12 this month',
    onlineSessions: totalSessions,
    onlineRoutersCount: routers.filter((r) => r.status === 'ONLINE').length,
    totalRoutersCount: routers.length,
    currentMonthBilledFormatted: '৳245,800',
    currentMonthPaidFormatted: '৳198k',
    collectionRate: '80.5%',
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <AppShell
      title="Network & Billing Overview"
      description="Real-time ISP infrastructure health, active subscriber sessions, and collection telemetry."
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200/80 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 shadow-2xs transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Telemetry</span>
          </button>
          <Link
            href="/dashboard/subscribers"
            className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-xs transition hover:bg-neutral-800"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Subscriber</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Modular KPI Summary Cards with Sparklines & Gauges */}
        <DashboardStatsCards metrics={metrics} />

        {/* Modular Network & Financial Telemetry Graphs */}
        <DashboardChartsSection />

        {/* Modular Routers Inventory & Health Status */}
        <RouterGatewayTelemetryTable routers={routers} />

        {/* Modular Two-Column Lower Section: Quick Operations & Recent Audit Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <QuickOperationsCard />
          </div>
          <div className="lg:col-span-2">
            <RecentOperationsLogCard activities={recentActivities} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
