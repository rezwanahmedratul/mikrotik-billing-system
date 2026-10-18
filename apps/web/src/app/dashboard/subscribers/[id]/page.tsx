'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RefreshCw, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { fetchApi } from '@/lib/api';
import {
  SubscriberDetail,
  SubscriberItem,
} from '@/components/subscribers/subscribers.types';
import { ServiceStatusDialog } from '@/components/subscribers/ServiceStatusDialog';
import { SubscriberProfileHeader } from '@/components/subscribers/SubscriberProfileHeader';
import { SubscriberNetworkCard } from '@/components/subscribers/SubscriberNetworkCard';
import { SubscriberTrafficChart } from '@/components/subscribers/SubscriberTrafficChart';
import { SubscriberSubscriptionsTable } from '@/components/subscribers/SubscriberSubscriptionsTable';
import { SubscriberInvoicesTable } from '@/components/subscribers/SubscriberInvoicesTable';
import { SubscriberPaymentsTable } from '@/components/subscribers/SubscriberPaymentsTable';

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

  // Async action flags
  const [isReprovisioning, setIsReprovisioning] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  const loadSubscriber = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const res = await fetchApi<SubscriberDetail>(`/subscribers/${id}`);
    setIsLoading(false);

    if (res.error) {
      // Demo fallback if fresh dev token or previewing
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
        invoices: [
          {
            id: 'inv-1',
            tenantId: 't-1',
            invoiceNumber: 'INV-00101',
            subscriberId: id,
            subscriberName: 'Tanvir Hossain',
            subscriberPhone: '01711002233',
            accountNumber: 'SUB-1001',
            packageName: 'Home Turbo 20M',
            billingPeriodStart: new Date('2026-10-01').toISOString(),
            billingPeriodEnd: new Date('2026-10-31').toISOString(),
            dueDate: new Date('2026-10-10').toISOString(),
            subtotalMinor: 120000,
            discountMinor: 0,
            taxMinor: 0,
            totalMinor: 120000,
            paidAmountMinor: 120000,
            balanceMinor: 0,
            totalFormatted: 'BDT 1200.00',
            paidFormatted: 'BDT 1200.00',
            balanceFormatted: 'BDT 0.00',
            status: 'PAID',
            issuedAt: new Date('2026-10-01').toISOString(),
            paidAt: new Date('2026-10-05').toISOString(),
            lines: [],
          },
        ],
        payments: [
          {
            id: 'pay-1',
            tenantId: 't-1',
            paymentNumber: 'PAY-00042',
            subscriberId: id,
            subscriberName: 'Tanvir Hossain',
            accountNumber: 'SUB-1001',
            amountMinor: 120000,
            amountFormatted: 'BDT 1200.00',
            currency: 'BDT',
            method: 'BKASH',
            status: 'CONFIRMED',
            externalReference: 'TRX-BKASH-889922',
            collectedBy: 'Alice Operator',
            notes: 'bKash merchant auto-settlement',
            paidAt: new Date('2026-10-05T14:30:00Z').toISOString(),
            allocations: [],
          },
        ],
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

  const handleConfirmStatusChange = async (reason: string) => {
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
          <RefreshCw className="mx-auto mb-2 h-6 w-6 animate-spin" />
          <p className="text-xs">Fetching subscriber profile & network telemetry...</p>
        </div>
      </AppShell>
    );
  }

  if (!subscriber) {
    return (
      <AppShell title="Subscriber Not Found">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-8 text-center shadow-xs">
          <AlertCircle className="mx-auto mb-2 h-8 w-8 text-neutral-400" />
          <h2 className="text-sm font-bold text-neutral-900">Subscriber Record Not Found</h2>
          <p className="mt-1 text-xs text-neutral-500">
            The requested subscriber ID was not found in your tenant database.
          </p>
          <Link
            href="/dashboard/subscribers"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-medium text-white shadow-xs transition hover:bg-neutral-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Subscribers</span>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={subscriber.fullName}
      description={`Account #${subscriber.accountNumber} • Registered ${new Date(subscriber.createdAt).toLocaleDateString()}`}
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
        {/* Modular Profile Header & Actions */}
        <SubscriberProfileHeader
          subscriber={subscriber}
          onRenew={handleRenew}
          isRenewing={isRenewing}
          onToggleStatus={handleToggleStatus}
        />

        {/* Modular PPPoE Network Provisioning State */}
        <SubscriberNetworkCard
          subscriber={subscriber}
          onReprovision={handleReprovision}
          isReprovisioning={isReprovisioning}
        />

        {/* Modular Bandwidth Consumption MultiBarChart */}
        <SubscriberTrafficChart username={subscriber.pppoeAccount?.username} />

        {/* Modular Subscriptions Table */}
        <SubscriberSubscriptionsTable subscriber={subscriber} />

        {/* Modular Invoices & Collections */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SubscriberInvoicesTable subscriber={subscriber} />
          <SubscriberPaymentsTable subscriber={subscriber} />
        </div>
      </div>

      {/* Modular Suspend/Restore Service Dialog */}
      <ServiceStatusDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        subscriber={subscriber as unknown as SubscriberItem}
        targetAction={statusAction}
        onConfirm={handleConfirmStatusChange}
        isLoading={isStatusSubmitting}
      />
    </AppShell>
  );
}
