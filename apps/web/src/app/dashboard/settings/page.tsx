'use client';

import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { fetchApi } from '@/lib/api';
import { TenantSettingsData, SystemStatusData } from '@/components/settings/settings.types';
import { GeneralSettingsForm } from '@/components/settings/GeneralSettingsForm';
import { BillingPolicyCard } from '@/components/settings/BillingPolicyCard';
import { GatewayCredentialsCard } from '@/components/settings/GatewayCredentialsCard';
import { SystemDiagnosticsCard } from '@/components/settings/SystemDiagnosticsCard';

export default function TenantSettingsPage() {
  const [settings, setSettings] = useState<TenantSettingsData>({
    id: 't-1',
    name: 'FastNet Broadband Ltd',
    slug: 'fastnet',
    supportEmail: 'support@fastnet.com',
    supportPhone: '01711002233',
    address: 'Level 4, House 12, Road 4, Dhanmondi, Dhaka-1205',
    currency: 'BDT',
    invoiceDueDays: 10,
    gracePeriodDays: 3,
    autoSuspensionEnabled: true,
    smsAlertsEnabled: true,
    defaultPppoeProfile: 'default-encryption',
    bkashMerchantConfigured: true,
    nagadMerchantConfigured: true,
    sslcommerzConfigured: true,
    smsGatewayConfigured: true,
    routerOsApiPort: 8728,
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatusData>({
    apiStatus: 'ONLINE',
    dbStatus: 'CONNECTED',
    redisStatus: 'CONNECTED',
    workerStatus: 'ACTIVE',
    activeRoutersCount: 2,
    activeSubscribersCount: 326,
    platformVersion: 'v1.0.0-rc1',
    environment: 'production',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSaveSettings = async (updated: Partial<TenantSettingsData>) => {
    setIsSaving(true);
    setErrorMessage('');
    // Persist to local state and update local storage tenant cache
    setSettings((prev) => {
      const next = { ...prev, ...updated };
      if (typeof window !== 'undefined' && updated.name) {
        try {
          const cached = localStorage.getItem('auth_user');
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.tenantName = updated.name;
            localStorage.setItem('auth_user', JSON.stringify(parsed));
          }
        } catch {
          // ignore parse errors
        }
      }
      return next;
    });

    // Make API call if endpoint exists
    await fetchApi('/tenants/current', {
      method: 'PATCH',
      body: JSON.stringify(updated),
    });

    setIsSaving(false);
    setSuccessMessage('Tenant settings updated successfully.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <AppShell
      title="Tenant Settings"
      description="Configure organization profile, ISP collection policies, payment gateway integrations, and inspect runtime system health."
    >
      {/* Alert Notifications */}
      {successMessage && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-900 p-4 text-white animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-white shrink-0" />
            <p className="text-xs font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-xs text-neutral-300 underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-neutral-300 bg-neutral-100 p-4 text-neutral-900 animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-neutral-900 shrink-0" />
            <p className="text-xs font-medium">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage('')}
            className="text-xs text-neutral-600 underline hover:text-neutral-900"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Top Section: General Settings and Billing Policy */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GeneralSettingsForm
            settings={settings}
            onSave={handleSaveSettings}
            isLoading={isSaving}
          />
          <BillingPolicyCard
            settings={settings}
            onSave={handleSaveSettings}
            isLoading={isSaving}
          />
        </div>

        {/* Lower Section: Gateway Integrations and System Diagnostics */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GatewayCredentialsCard settings={settings} />
          <SystemDiagnosticsCard system={systemStatus} />
        </div>
      </div>
    </AppShell>
  );
}
