'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  RefreshCw,
  Download,
  Calendar,
  CreditCard,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { fetchApi } from '@/lib/api';
import {
  DashboardOverviewData,
  CollectionsReportData,
  AgingReportData,
  SubscriberGrowthData,
  AuditLogListResponse,
} from '@/components/reports/reports.types';
import { ReportMetricsCards } from '@/components/reports/ReportMetricsCards';
import { CollectionsReportView } from '@/components/reports/CollectionsReportView';
import { AgingReportView } from '@/components/reports/AgingReportView';
import { SubscriberGrowthView } from '@/components/reports/SubscriberGrowthView';
import { AuditLogsTableView } from '@/components/reports/AuditLogsTableView';

type ReportTab = 'overview' | 'aging' | 'growth' | 'audit';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [periodPreset, setPeriodPreset] = useState<'all' | 'this_month' | 'last_30_days'>('this_month');
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Data states
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [collections, setCollections] = useState<CollectionsReportData | null>(null);
  const [aging, setAging] = useState<AgingReportData | null>(null);
  const [growth, setGrowth] = useState<SubscriberGrowthData | null>(null);

  // Audit Log states
  const [auditLogs, setAuditLogs] = useState<AuditLogListResponse | null>(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');

  const getDateRange = useCallback(() => {
    const now = new Date();
    if (periodPreset === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: startOfMonth.toISOString(),
        endDate: now.toISOString(),
      };
    } else if (periodPreset === 'last_30_days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
      return {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: now.toISOString(),
      };
    }
    return { startDate: undefined, endDate: undefined };
  }, [periodPreset]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const range = getDateRange();

    const rangeQuery = range.startDate
      ? `?startDate=${encodeURIComponent(range.startDate)}&endDate=${encodeURIComponent(
          range.endDate || ''
        )}`
      : '';

    // Parallel fetch based on active tab
    try {
      const [ovRes, colRes] = await Promise.all([
        fetchApi<DashboardOverviewData>('/reports/dashboard-overview'),
        fetchApi<CollectionsReportData>(`/reports/collections${rangeQuery}`),
      ]);

      if (ovRes.data) setOverview(ovRes.data);
      if (colRes.data) setCollections(colRes.data);

      if (activeTab === 'aging') {
        const agingRes = await fetchApi<AgingReportData>('/reports/aging');
        if (agingRes.data) setAging(agingRes.data);
      } else if (activeTab === 'growth') {
        const growthRes = await fetchApi<SubscriberGrowthData>(`/reports/subscriber-growth${rangeQuery}`);
        if (growthRes.data) setGrowth(growthRes.data);
      } else if (activeTab === 'audit') {
        const params = new URLSearchParams({
          page: String(auditPage),
          limit: '15',
        });
        if (auditActionFilter !== 'ALL') params.append('action', auditActionFilter);
        if (auditSearch.trim()) params.append('search', auditSearch.trim());

        const auditRes = await fetchApi<AuditLogListResponse>(`/reports/audit-logs?${params.toString()}`);
        if (auditRes.data) setAuditLogs(auditRes.data);
      }
    } catch {
      // Fallback graceful handling
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, getDateRange, auditPage, auditActionFilter, auditSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Export handler for CSV
  const handleExportCsv = () => {
    setIsExporting(true);
    try {
      if (activeTab === 'overview' && collections) {
        const headers = ['Method', 'Transactions Count', 'Total Collected (BDT)'];
        const rows = Object.entries(collections.byMethod).map(([method, info]) => [
          method,
          String(info.count),
          (info.totalMinor / 100).toFixed(2),
        ]);
        const csvContent =
          'data:text/csv;charset=utf-8,' +
          [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `collections_report_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (activeTab === 'aging' && aging) {
        const headers = ['Subscriber', 'Account', 'Phone', 'Unpaid Invoices', 'Days Overdue', 'Balance (BDT)'];
        const rows = aging.topDebtors.map((d) => [
          `"${d.subscriberName}"`,
          d.accountNumber,
          d.phone,
          String(d.invoiceCount),
          String(d.daysOverdue),
          (d.balanceMinor / 100).toFixed(2),
        ]);
        const csvContent =
          'data:text/csv;charset=utf-8,' +
          [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `aging_debtors_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (activeTab === 'audit' && auditLogs) {
        const headers = ['Timestamp', 'Actor', 'Action', 'EntityType', 'EntityID', 'IP'];
        const rows = auditLogs.items.map((l) => [
          `"${l.createdAt}"`,
          `"${l.user?.fullName || 'System'}"`,
          l.action,
          l.entityType,
          `"${l.entityId}"`,
          l.ipAddress || '',
        ]);
        const csvContent =
          'data:text/csv;charset=utf-8,' +
          [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `audit_trail_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppShell
      title="Analytics & Executive Reports"
      description="Audited ledger collections, subscriber churn analysis, aging receivables, and system tamper logs."
      action={
        <div className="flex items-center gap-2">
          {/* Preset Window Segmented Bar */}
          <div className="hidden sm:inline-flex items-center p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800">
            <button
              onClick={() => setPeriodPreset('this_month')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                periodPreset === 'this_month'
                  ? 'bg-white dark:bg-black text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white font-medium'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriodPreset('last_30_days')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                periodPreset === 'last_30_days'
                  ? 'bg-white dark:bg-black text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white font-medium'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setPeriodPreset('all')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                periodPreset === 'all'
                  ? 'bg-white dark:bg-black text-neutral-900 dark:text-white shadow-xs font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white font-medium'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-black px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition hover:bg-neutral-50 dark:hover:bg-neutral-900 interactive-btn"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-900 hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-neutral-200 px-3.5 py-1.5 text-xs font-semibold transition shadow-xs interactive-btn"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Top Cards */}
        <ReportMetricsCards overview={overview} isLoading={isLoading} />

        {/* Sleek Segmented Report View Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-100/90 dark:bg-neutral-900/90 border border-neutral-200/80 dark:border-neutral-800 backdrop-blur-xs shadow-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs transition-all ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-black text-neutral-900 dark:text-white shadow-xs font-semibold border border-neutral-200/60 dark:border-neutral-800'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium hover:bg-white/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Collections & Revenue</span>
          </button>

          <button
            onClick={() => setActiveTab('aging')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs transition-all ${
              activeTab === 'aging'
                ? 'bg-white dark:bg-black text-neutral-900 dark:text-white shadow-xs font-semibold border border-neutral-200/60 dark:border-neutral-800'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium hover:bg-white/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Overdue Aging</span>
          </button>

          <button
            onClick={() => setActiveTab('growth')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs transition-all ${
              activeTab === 'growth'
                ? 'bg-white dark:bg-black text-neutral-900 dark:text-white shadow-xs font-semibold border border-neutral-200/60 dark:border-neutral-800'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium hover:bg-white/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Subscriber Churn & Growth</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs transition-all ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-black text-neutral-900 dark:text-white shadow-xs font-semibold border border-neutral-200/60 dark:border-neutral-800'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium hover:bg-white/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Audit Trail Log</span>
          </button>
        </div>

        {/* Tab Content Panes */}
        {activeTab === 'overview' && (
          <CollectionsReportView
            data={collections}
            isLoading={isLoading}
            onExportCsv={handleExportCsv}
          />
        )}

        {activeTab === 'aging' && <AgingReportView data={aging} isLoading={isLoading} />}

        {activeTab === 'growth' && <SubscriberGrowthView data={growth} isLoading={isLoading} />}

        {activeTab === 'audit' && (
          <AuditLogsTableView
            data={auditLogs}
            isLoading={isLoading}
            page={auditPage}
            onPageChange={(p) => setAuditPage(p)}
            searchQuery={auditSearch}
            onSearchChange={(q) => {
              setAuditSearch(q);
              setAuditPage(1);
            }}
            actionFilter={auditActionFilter}
            onActionChange={(act) => {
              setAuditActionFilter(act);
              setAuditPage(1);
            }}
          />
        )}
      </div>
    </AppShell>
  );
}
