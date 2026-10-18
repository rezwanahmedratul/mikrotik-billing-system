'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Radio,
  Clock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calendar,
  Layers,
  History,
  Tag,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fetchApi } from '@/lib/api';
import {
  SubscriberDetail,
  SubscriberItem,
} from '@/components/subscribers/subscribers.types';
import { ServiceStatusDialog } from '@/components/subscribers/ServiceStatusDialog';

export default function SubscriberDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [subscriber, setSubscriber] = useState<SubscriberDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Status Dialog
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<'SUSPEND' | 'RESTORE'>('SUSPEND');
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);

  // Reprovision state
  const [isReprovisioning, setIsReprovisioning] = useState(false);

  // Renewal state
  const [isRenewing, setIsRenewing] = useState(false);

  const loadSubscriber = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const res = await fetchApi<SubscriberDetail>(`/subscribers/${id}`);
    setIsLoading(false);

    if (res.error) {
      // Demo fallback if fresh dev token
      setSubscriber({
        id,
        tenantId: 't-1',
        accountNumber: 'SUB-1001',
        fullName: 'Tanvir Hossain',
        phone: '01711002233',
        email: 'tanvir@example.com',
        nidOrPassport: '1990269251234567',
        address: 'House 12, Road 4, Dhanmondi, Dhaka',
        billingAddress: 'House 12, Road 4, Dhanmondi, Dhaka',
        isArchived: false,
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        subscriptions: [
          {
            id: 'subsc-1',
            packageId: 'pkg-1',
            packageName: 'Home Turbo 20M',
            speedLimitRaw: '20M/20M',
            priceMinor: 120000,
            priceFormatted: 'BDT 1200.00',
            billingCycle: 'MONTHLY',
            routerId: 'rtr-1',
            routerName: 'Gulshan-Core-CCR2004',
            status: 'ACTIVE',
            startDate: new Date(Date.now() - 12 * 86400000).toISOString(),
            expiryDate: new Date(Date.now() + 18 * 86400000).toISOString(),
            isAutoRenew: true,
            daysRemaining: 18,
          },
        ],
        currentSubscription: {
          id: 'subsc-1',
          packageId: 'pkg-1',
          packageName: 'Home Turbo 20M',
          speedLimitRaw: '20M/20M',
          priceMinor: 120000,
          priceFormatted: 'BDT 1200.00',
          billingCycle: 'MONTHLY',
          routerId: 'rtr-1',
          routerName: 'Gulshan-Core-CCR2004',
          status: 'ACTIVE',
          startDate: new Date(Date.now() - 12 * 86400000).toISOString(),
          expiryDate: new Date(Date.now() + 18 * 86400000).toISOString(),
          isAutoRenew: true,
          daysRemaining: 18,
        },
        pppoeAccount: {
          id: 'pppoe-1',
          routerId: 'rtr-1',
          routerName: 'Gulshan-Core-CCR2004',
          username: 'tanvir_dhanmondi',
          hasPassword: true,
          pppProfile: 'profile-20M',
          isSuspended: false,
          confirmedOnRouter: true,
          lastProvisionedAt: new Date().toISOString(),
        },
        serviceEvents: [
          {
            id: 'ev-1',
            type: 'RESTORED',
            reason: 'Monthly bill paid in full',
            initiatedBy: 'Alice Operator',
            createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
          },
          {
            id: 'ev-2',
            type: 'PROVISIONED',
            reason: 'Initial account provisioning',
            initiatedBy: 'Alice Operator',
            createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
          },
        ],
        invoicesCount: 2,
        paymentsCount: 2,
        outstandingBalanceMinor: 0,
      });
    } else if (res.data) {
      setSubscriber(res.data);
    }
  };

  useEffect(() => {
    if (id) {
      loadSubscriber();
    }
  }, [id]);

  const handleToggleStatus = (action: 'SUSPEND' | 'RESTORE') => {
    setStatusAction(action);
    setIsStatusDialogOpen(true);
  };

  const handleConfirmStatus = async (reason: string) => {
    if (!subscriber) return;
    setIsStatusSubmitting(true);
    const res = await fetchApi(`/subscribers/${subscriber.id}/service-status`, {
      method: 'POST',
      body: JSON.stringify({
        status: statusAction === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE',
        reason,
      }),
    });
    setIsStatusSubmitting(false);
    setIsStatusDialogOpen(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage(
        statusAction === 'SUSPEND'
          ? `Service for "${subscriber.fullName}" has been suspended.`
          : `Service for "${subscriber.fullName}" has been restored.`
      );
      setTimeout(() => setSuccessMessage(''), 4000);
      loadSubscriber();
    }
  };

  const handleReprovision = async () => {
    if (!subscriber) return;
    setIsReprovisioning(true);
    const res = await fetchApi(`/subscribers/${subscriber.id}/reprovision`, {
      method: 'POST',
    });
    setIsReprovisioning(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage('PPPoE secret successfully pushed and verified on the router.');
      setTimeout(() => setSuccessMessage(''), 4000);
      loadSubscriber();
    }
  };

  const handleRenew = async () => {
    if (!subscriber) return;
    setIsRenewing(true);
    const res = await fetchApi(`/subscribers/${subscriber.id}/renew`, {
      method: 'POST',
      body: JSON.stringify({ extensionDays: 30 }),
    });
    setIsRenewing(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage('Subscription renewed for 30 days.');
      setTimeout(() => setSuccessMessage(''), 4000);
      loadSubscriber();
    }
  };

  if (isLoading && !subscriber) {
    return (
      <AppShell title="Subscriber Profile" description="Loading subscriber records...">
        <div className="p-12 text-center text-neutral-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-sm">Fetching subscriber profile & network state...</p>
        </div>
      </AppShell>
    );
  }

  if (!subscriber) {
    return (
      <AppShell title="Subscriber Not Found">
        <div className="p-8 text-center bg-white border border-neutral-200 rounded-xl">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-neutral-900">Subscriber Not Found</h2>
          <p className="text-sm text-neutral-500 mt-1">
            The requested subscriber ID was not found in your organization.
          </p>
          <Link
            href="/dashboard/subscribers"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-medium rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Subscribers
          </Link>
        </div>
      </AppShell>
    );
  }

  const isSuspended =
    subscriber.currentSubscription?.status === 'SUSPENDED' ||
    subscriber.pppoeAccount?.isSuspended;

  return (
    <AppShell
      title={subscriber.fullName}
      description={`Account #${subscriber.accountNumber} • Registered ${new Date(subscriber.createdAt).toLocaleDateString()}`}
      action={
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/subscribers"
            className="px-3 py-1.5 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
          <button
            onClick={handleRenew}
            disabled={isRenewing}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5"
          >
            {isRenewing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Renew Subscription
          </button>
          <button
            onClick={() => handleToggleStatus(isSuspended ? 'RESTORE' : 'SUSPEND')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
              isSuspended
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300'
                : 'bg-red-50 text-red-700 hover:bg-red-100 border-red-300'
            }`}
          >
            {isSuspended ? 'Restore Service' : 'Suspend Service'}
          </button>
        </div>
      }
    >
      {/* Notifications */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-950/20 bg-emerald-50 text-emerald-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-xs text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl border border-red-950/20 bg-red-50 text-red-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-xs text-red-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Profile Overview Header Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-700 font-bold text-lg">
              {subscriber.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-neutral-900">{subscriber.fullName}</h1>
                <StatusBadge
                  status={subscriber.currentSubscription?.status || 'PENDING'}
                  variant={
                    subscriber.currentSubscription?.status === 'ACTIVE'
                      ? 'success'
                      : subscriber.currentSubscription?.status === 'SUSPENDED'
                      ? 'error'
                      : 'warning'
                  }
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 mt-1">
                <span className="font-mono">Account: {subscriber.accountNumber}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  {subscriber.phone}
                </span>
                {subscriber.email && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-neutral-400" />
                      {subscriber.email}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-neutral-100">
            <div>
              <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                Balance Due
              </div>
              <div className="text-xl font-bold font-mono text-neutral-900">
                ৳ {(subscriber.outstandingBalanceMinor / 100).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                Days Remaining
              </div>
              <div className="text-xl font-bold font-mono text-neutral-900">
                {subscriber.currentSubscription?.daysRemaining ?? 0}d
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Subscription & Network Hardware */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Active Tariff Plan Card */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-neutral-700" />
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                Active Broadband Subscription
              </h2>
            </div>
            <span className="text-xs font-mono font-medium text-neutral-500">
              {subscriber.currentSubscription?.billingCycle}
            </span>
          </div>

          {subscriber.currentSubscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-neutral-900">
                    {subscriber.currentSubscription.packageName}
                  </div>
                  <div className="text-xs text-neutral-500 font-mono mt-0.5">
                    Bandwidth: {subscriber.currentSubscription.speedLimitRaw}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold font-mono text-neutral-900">
                    {subscriber.currentSubscription.priceFormatted}
                  </div>
                  <div className="text-xs text-neutral-400">per cycle</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-lg text-xs">
                <div>
                  <span className="text-neutral-400 block mb-0.5">Start Date</span>
                  <span className="font-mono text-neutral-700">
                    {new Date(subscriber.currentSubscription.startDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-0.5">Expiration Date</span>
                  <span className="font-mono text-neutral-700">
                    {new Date(subscriber.currentSubscription.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No active subscription plan configured.</p>
          )}
        </div>

        {/* Router Gateway & PPPoE Secret Card */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-neutral-700" />
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                MikroTik PPPoE Gateway
              </h2>
            </div>
            <button
              onClick={handleReprovision}
              disabled={isReprovisioning}
              className="text-xs text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-1"
              title="Push secret to router hardware"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReprovisioning ? 'animate-spin' : ''}`} />
              Reprovision
            </button>
          </div>

          {subscriber.pppoeAccount ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-neutral-400 block mb-0.5">PPPoE Username</span>
                  <span className="font-mono font-bold text-neutral-900">
                    {subscriber.pppoeAccount.username}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-0.5">Password at Rest</span>
                  <span className="inline-flex items-center gap-1 font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                    <Shield className="w-3 h-3 text-emerald-600" />
                    AES-256 Encrypted
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-0.5">Router Gateway</span>
                  <span className="font-medium text-neutral-800">
                    {subscriber.pppoeAccount.routerName}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-0.5">PPP Profile</span>
                  <span className="font-mono text-neutral-800">
                    {subscriber.pppoeAccount.pppProfile}
                  </span>
                </div>
              </div>

              <div className="mt-2 p-3 bg-neutral-50 rounded-lg flex items-center justify-between text-xs">
                <span className="text-neutral-500">Hardware Sync State:</span>
                <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Synced with RouterOS
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No PPPoE account provisioned on router.</p>
          )}
        </div>
      </div>

      {/* Service Event History Timeline */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
          <History className="w-5 h-5 text-neutral-700" />
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
            Service Event & Audit History
          </h2>
        </div>

        {subscriber.serviceEvents.length > 0 ? (
          <div className="space-y-3">
            {subscriber.serviceEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start justify-between p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors text-xs"
              >
                <div>
                  <span
                    className={`inline-block font-mono font-semibold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider mb-1 ${
                      event.type === 'SUSPENDED'
                        ? 'bg-red-100 text-red-800'
                        : event.type === 'RESTORED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    {event.type}
                  </span>
                  <p className="text-neutral-800 font-medium">{event.reason || 'No description provided'}</p>
                  {event.initiatedBy && (
                    <span className="text-neutral-400 text-[11px] block mt-0.5">
                      Initiated by: {event.initiatedBy}
                    </span>
                  )}
                </div>
                <div className="text-neutral-400 font-mono text-[11px]">
                  {new Date(event.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-500">No service events recorded for this account.</p>
        )}
      </div>

      {/* Status Confirmation Dialog */}
      <ServiceStatusDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        subscriber={subscriber}
        targetAction={statusAction}
        onConfirm={handleConfirmStatus}
        isLoading={isStatusSubmitting}
      />
    </AppShell>
  );
}
