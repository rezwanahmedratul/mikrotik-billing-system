'use client';

import React, { useState } from 'react';
import { ShieldAlert, Calendar, Clock, RefreshCw, Save, Check } from 'lucide-react';
import { TenantSettingsData } from './settings.types';

interface BillingPolicyCardProps {
  settings: TenantSettingsData;
  onSave: (updated: Partial<TenantSettingsData>) => Promise<void>;
  isLoading?: boolean;
}

export function BillingPolicyCard({
  settings,
  onSave,
  isLoading = false,
}: BillingPolicyCardProps) {
  const [invoiceDueDays, setInvoiceDueDays] = useState(settings.invoiceDueDays);
  const [gracePeriodDays, setGracePeriodDays] = useState(settings.gracePeriodDays);
  const [autoSuspensionEnabled, setAutoSuspensionEnabled] = useState(
    settings.autoSuspensionEnabled
  );
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(settings.smsAlertsEnabled);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      invoiceDueDays,
      gracePeriodDays,
      autoSuspensionEnabled,
      smsAlertsEnabled,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-neutral-800 dark:bg-black">
      <div className="mb-5 border-b border-neutral-100 dark:border-neutral-800 pb-4">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Billing & Lifecycle Policy</h2>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          Automated collection thresholds, payment grace periods, and auto-suspension enforcement
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Invoice Payment Term (Days)</label>
            <div className="relative mt-1.5">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="number"
                min={1}
                max={60}
                required
                value={invoiceDueDays}
                onChange={(e) => setInvoiceDueDays(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black py-2 pl-9 pr-3 text-xs text-neutral-900 dark:text-white transition focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:focus:border-white dark:focus:ring-white"
              />
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">Days after generation before an invoice becomes overdue (e.g. 10 days)</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">Grace Period (Days)</label>
            <div className="relative mt-1.5">
              <Clock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="number"
                min={0}
                max={30}
                required
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                className="w-full rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black py-2 pl-9 pr-3 text-xs text-neutral-900 dark:text-white transition focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:focus:border-white dark:focus:ring-white"
              />
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">Additional grace days after overdue date before router suspension</p>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 dark:bg-black p-3.5 transition hover:bg-neutral-50/50 dark:hover:bg-neutral-900 cursor-pointer">
            <input
              type="checkbox"
              checked={autoSuspensionEnabled}
              onChange={(e) => setAutoSuspensionEnabled(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-700 dark:bg-black"
            />
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-white">Enforce Automated Suspension</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                When active, the worker cron automatically disables PPPoE secrets and triggers active session termination for expired subscriptions
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-neutral-200 dark:border-neutral-800 dark:bg-black p-3.5 transition hover:bg-neutral-50/50 dark:hover:bg-neutral-900 cursor-pointer">
            <input
              type="checkbox"
              checked={smsAlertsEnabled}
              onChange={(e) => setSmsAlertsEnabled(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-black focus:ring-black dark:border-neutral-700 dark:bg-black"
            />
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-white">Automated SMS Reminders</div>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Send automated SMS notifications on invoice issuance, 3 days before expiry, upon suspension, and on payment confirmation
              </div>
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 disabled:opacity-50"
          >
            {isSaved ? (
              <>
                <Check className="h-3.5 w-3.5 text-white dark:text-black" />
                <span>Policy Updated</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Update Policy</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
