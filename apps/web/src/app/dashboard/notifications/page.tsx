'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { fetchApi } from '@/lib/api';
import {
  NotificationLogItem,
  NotificationTemplateItem,
} from '@/components/notifications/notifications.types';
import { NotificationStatsCards } from '@/components/notifications/NotificationStatsCards';
import { NotificationDistributionCharts } from '@/components/notifications/NotificationDistributionCharts';
import { NotificationLogsTable } from '@/components/notifications/NotificationLogsTable';
import { NotificationTemplatesList } from '@/components/notifications/NotificationTemplatesList';
import { TemplateEditorModal } from '@/components/notifications/TemplateEditorModal';
import { SendSmsModal } from '@/components/notifications/SendSmsModal';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'templates'>('logs');
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplateItem | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage('');

    // Load templates
    const tplRes = await fetchApi<NotificationTemplateItem[]>('/notifications/templates');
    if (tplRes.data) {
      setTemplates(tplRes.data);
    }

    // Load logs
    const queryParams = new URLSearchParams();
    if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());
    if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);

    const logsRes = await fetchApi<NotificationLogItem[]>(`/notifications/logs?${queryParams.toString()}`);
    setIsLoading(false);

    if (logsRes.error) {
      // Demo fallback
      setLogs([
        {
          id: 'log-1',
          recipientPhone: '8801715000001',
          message:
            'Dear Tanvir Hossain, invoice #INV-00101 of BDT 1200.00 is issued. Due date: Nov 10, 2026. Pay online to avoid disconnection.',
          status: 'DELIVERED',
          attempts: 1,
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          id: 'log-2',
          recipientPhone: '8801819999888',
          message:
            'Dear Farhana Ahmed, we received your payment of BDT 800.00 (Ref: TRX-BKASH-7711). Account balance: BDT 0.00. Thank you.',
          status: 'DELIVERED',
          attempts: 1,
          sentAt: new Date(Date.now() - 3600000).toISOString(),
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    } else if (logsRes.data) {
      setLogs(logsRes.data);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, statusFilter]);

  const handleRetryJob = async (log: NotificationLogItem) => {
    const res = await fetchApi(`/notifications/logs/${log.id}/retry`, {
      method: 'POST',
    });
    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage(`Retried message to +${log.recipientPhone}.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadData();
    }
  };

  const handleSaveTemplate = async (
    type: string,
    data: { templateText: string; isEnabled: boolean }
  ) => {
    const res = await fetchApi(`/notifications/templates/${type}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.error) {
      throw new Error(res.error);
    } else {
      setSuccessMessage(`Template "${type}" updated successfully.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadData();
    }
  };

  return (
    <AppShell
      title="SMS & Notifications"
      description="Manage automated billing alerts, configure dynamic SMS templates, inspect delivery status, and broadcast direct messages."
    >
      {/* Alert Notifications */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl border border-neutral-200 bg-neutral-900 text-white dark:border-neutral-700 dark:bg-white dark:text-neutral-950 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-xs text-neutral-300 dark:text-neutral-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-xs hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <NotificationStatsCards logs={logs} templates={templates} />

      {/* Outbound SMS Distribution Charts */}
      <NotificationDistributionCharts logs={logs} />

      {/* Top Toolbar: Tabs and Actions */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 mb-6 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'logs'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Delivery Logs ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'templates'
                ? 'bg-white text-neutral-900 shadow-xs dark:bg-neutral-700 dark:text-white'
                : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Automated Templates ({templates.length})</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {activeTab === 'logs' && (
            <>
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter phone or message..."
                  className="w-full pl-9 pr-3 py-1.5 bg-neutral-50/70 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500 transition-colors"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-neutral-50/70 border border-neutral-200 rounded-xl text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white transition-colors"
              >
                <option value="ALL">All Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed</option>
                <option value="QUEUED">Queued</option>
              </select>
            </>
          )}

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 border border-neutral-200 text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-50 transition-colors"
            title="Refresh logs and templates"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsSendModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compose Direct SMS</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'logs' ? (
        <NotificationLogsTable
          logs={logs}
          isLoading={isLoading}
          onRetry={handleRetryJob}
        />
      ) : (
        <NotificationTemplatesList
          templates={templates}
          onEdit={(t) => setEditingTemplate(t)}
        />
      )}

      {/* Send Direct SMS Modal */}
      <SendSmsModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSuccess={(msg) => {
          setSuccessMessage(msg);
          setTimeout(() => setSuccessMessage(''), 5000);
          loadData();
        }}
      />

      {/* Template Editor Modal */}
      <TemplateEditorModal
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        template={editingTemplate}
        onSave={handleSaveTemplate}
      />
    </AppShell>
  );
}
