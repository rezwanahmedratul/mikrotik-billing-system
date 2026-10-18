'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserPlus,
  RefreshCw,
  Phone,
  Radio,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { fetchApi } from '@/lib/api';
import {
  SubscriberItem,
  CreateSubscriberFormData,
} from '@/components/subscribers/subscribers.types';
import { SubscriberStatsCards } from '@/components/subscribers/SubscriberStatsCards';
import { SubscriberFiltersBar } from '@/components/subscribers/SubscriberFiltersBar';
import { SubscriberFormModal } from '@/components/subscribers/SubscriberFormModal';
import { ServiceStatusDialog } from '@/components/subscribers/ServiceStatusDialog';

interface PackageOption {
  id: string;
  name: string;
  priceFormatted: string;
  speedLimitRaw: string;
}

interface RouterOption {
  id: string;
  name: string;
  host: string;
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Dropdown options
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [routers, setRouters] = useState<RouterOption[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [routerFilter, setRouterFilter] = useState('ALL');

  // Modals & Dialogs
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [serviceStatusTarget, setServiceStatusTarget] = useState<{
    subscriber: SubscriberItem;
    action: 'SUSPEND' | 'RESTORE';
  } | null>(null);
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);

  const loadSubscribers = async () => {
    setIsLoading(true);
    setErrorMessage('');

    const queryParams = new URLSearchParams();
    if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());
    if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
    if (routerFilter !== 'ALL') queryParams.set('routerId', routerFilter);

    const res = await fetchApi<{ data: SubscriberItem[]; meta: { total: number } }>(
      `/subscribers?${queryParams.toString()}`
    );
    setIsLoading(false);

    if (res.error) {
      // Demo fallback data if API is loading or demo state
      setSubscribers([
        {
          id: 'sub-1',
          tenantId: 't-1',
          accountNumber: 'SUB-1001',
          fullName: 'Tanvir Hossain',
          phone: '01711002233',
          email: 'tanvir@example.com',
          address: 'House 12, Road 4, Dhanmondi, Dhaka',
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
            startDate: new Date().toISOString(),
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
        },
        {
          id: 'sub-2',
          tenantId: 't-1',
          accountNumber: 'SUB-1002',
          fullName: 'Farhana Ahmed',
          phone: '01899887766',
          email: 'farhana@example.com',
          address: 'Apt 4B, Sector 7, Uttara, Dhaka',
          isArchived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          currentSubscription: {
            id: 'subsc-2',
            packageId: 'pkg-2',
            packageName: 'Home Starter 10M',
            speedLimitRaw: '10M/10M',
            priceMinor: 80000,
            priceFormatted: 'BDT 800.00',
            billingCycle: 'MONTHLY',
            routerId: 'rtr-1',
            routerName: 'Gulshan-Core-CCR2004',
            status: 'SUSPENDED',
            startDate: new Date(Date.now() - 40 * 86400000).toISOString(),
            expiryDate: new Date(Date.now() - 10 * 86400000).toISOString(),
            isAutoRenew: false,
            daysRemaining: 0,
          },
          pppoeAccount: {
            id: 'pppoe-2',
            routerId: 'rtr-1',
            routerName: 'Gulshan-Core-CCR2004',
            username: 'farhana_uttara',
            hasPassword: true,
            pppProfile: 'profile-10M',
            isSuspended: true,
            confirmedOnRouter: true,
            lastProvisionedAt: new Date().toISOString(),
          },
        },
      ]);
      setTotalCount(2);
    } else if (res.data) {
      setSubscribers(res.data.data);
      setTotalCount(res.data.meta.total);
    }
  };

  const loadFilterOptions = async () => {
    const [pkgRes, rtrRes] = await Promise.all([
      fetchApi<any[]>('/packages'),
      fetchApi<any[]>('/routers'),
    ]);

    if (pkgRes.data) {
      setPackages(
        pkgRes.data.map((p) => ({
          id: p.id,
          name: p.name,
          priceFormatted: p.priceFormatted,
          speedLimitRaw: p.speedLimitRaw,
        }))
      );
    }
    if (rtrRes.data) {
      setRouters(
        rtrRes.data.map((r) => ({
          id: r.id,
          name: r.name,
          host: r.host,
        }))
      );
    }
  };

  useEffect(() => {
    loadSubscribers();
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadSubscribers();
  }, [searchQuery, statusFilter, routerFilter]);

  const handleCreateSubscriber = async (formData: CreateSubscriberFormData) => {
    const res = await fetchApi<SubscriberItem>('/subscribers', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    if (res.error) {
      return res.error;
    }

    setIsCreateModalOpen(false);
    setSuccessMessage(`Subscriber "${formData.fullName}" registered & provisioned successfully.`);
    setTimeout(() => setSuccessMessage(''), 4000);
    loadSubscribers();
  };

  const handleConfirmStatusChange = async (reason: string) => {
    if (!serviceStatusTarget) return;

    setIsStatusSubmitting(true);
    const res = await fetchApi(
      `/subscribers/${serviceStatusTarget.subscriber.id}/service-status`,
      {
        method: 'POST',
        body: JSON.stringify({
          status: serviceStatusTarget.action === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE',
          reason,
        }),
      }
    );
    setIsStatusSubmitting(false);
    setServiceStatusTarget(null);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage(
        serviceStatusTarget.action === 'SUSPEND'
          ? `Service for "${serviceStatusTarget.subscriber.fullName}" has been suspended.`
          : `Service for "${serviceStatusTarget.subscriber.fullName}" has been restored.`
      );
      setTimeout(() => setSuccessMessage(''), 4000);
      loadSubscribers();
    }
  };

  return (
    <AppShell
      title="Subscribers & Subscriptions"
      description="Manage client accounts, assign broadband tariff plans, and monitor live PPPoE network provisioning."
      action={
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Register Subscriber
        </button>
      }
    >
      {/* Alert Banners */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-950/20 bg-emerald-50 text-emerald-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-xs text-emerald-700 hover:underline"
          >
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
          <button
            onClick={() => setErrorMessage('')}
            className="text-xs text-red-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Modular KPI Summary Cards */}
      <SubscriberStatsCards subscribers={subscribers} totalCount={totalCount} />

      {/* Modular Filters & Search Toolbar */}
      <SubscriberFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        routerFilter={routerFilter}
        onRouterChange={setRouterFilter}
        routers={routers}
        onRefresh={loadSubscribers}
        isLoading={isLoading}
      />

      {/* Subscribers Data Table */}
      <DataTable<SubscriberItem>
        columns={[
          {
            key: 'subscriber',
            header: 'Subscriber / Account',
            render: (sub: SubscriberItem) => (
              <div>
                <Link
                  href={`/dashboard/subscribers/${sub.id}`}
                  className="font-semibold text-neutral-900 hover:underline inline-flex items-center gap-1.5"
                >
                  <span>{sub.fullName}</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </Link>
                <div className="text-xs text-neutral-400 font-mono mt-0.5">
                  {sub.accountNumber}
                </div>
                {sub.address && (
                  <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5 max-w-xs">
                    {sub.address}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: 'contact',
            header: 'Contact',
            render: (sub: SubscriberItem) => (
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-neutral-800">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{sub.phone}</span>
                </div>
                {sub.email && (
                  <div className="text-[11px] text-neutral-400 truncate max-w-xs mt-0.5">
                    {sub.email}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: 'pppoe',
            header: 'PPPoE Secret / Gateway',
            render: (sub: SubscriberItem) => (
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-neutral-900">
                  <Radio className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{sub.pppoeAccount?.username || '—'}</span>
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                  <span>Router:</span>
                  <span className="font-medium text-neutral-700">
                    {sub.pppoeAccount?.routerName || 'Gateway'}
                  </span>
                </div>
              </div>
            ),
          },
          {
            key: 'package',
            header: 'Package & Speed',
            render: (sub: SubscriberItem) => (
              <div>
                <div className="text-xs font-medium text-neutral-900">
                  {sub.currentSubscription?.packageName || 'No plan assigned'}
                </div>
                <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                  {sub.currentSubscription?.speedLimitRaw} • {sub.currentSubscription?.priceFormatted}
                </div>
              </div>
            ),
          },
          {
            key: 'expiry',
            header: 'Validity / Renewal',
            render: (sub: SubscriberItem) => {
              const days = sub.currentSubscription?.daysRemaining ?? 0;
              const isUrgent = days <= 3 && sub.currentSubscription?.status === 'ACTIVE';

              return (
                <div>
                  <div
                    className={`inline-flex items-center gap-1 text-xs font-medium ${
                      isUrgent ? 'text-amber-600 font-semibold' : 'text-neutral-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{days > 0 ? `${days} days left` : 'Expired'}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {sub.currentSubscription?.expiryDate
                      ? new Date(sub.currentSubscription.expiryDate).toLocaleDateString()
                      : '—'}
                  </div>
                </div>
              );
            },
          },
          {
            key: 'status',
            header: 'Service Status',
            render: (sub: SubscriberItem) => {
              const status = sub.currentSubscription?.status || 'PENDING';
              return (
                <StatusBadge
                  status={status}
                  variant={
                    status === 'ACTIVE'
                      ? 'success'
                      : status === 'SUSPENDED'
                      ? 'error'
                      : 'warning'
                  }
                />
              );
            },
          },
          {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (sub: SubscriberItem) => {
              const isSuspended =
                sub.currentSubscription?.status === 'SUSPENDED' ||
                sub.pppoeAccount?.isSuspended;

              return (
                <div className="flex items-center justify-end gap-1.5">
                  <Link
                    href={`/dashboard/subscribers/${sub.id}`}
                    className="px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
                  >
                    Details
                  </Link>
                  <button
                    onClick={() =>
                      setServiceStatusTarget({
                        subscriber: sub,
                        action: isSuspended ? 'RESTORE' : 'SUSPEND',
                      })
                    }
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      isSuspended
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    }`}
                  >
                    {isSuspended ? 'Restore' : 'Suspend'}
                  </button>
                </div>
              );
            },
          },
        ]}
        data={subscribers}
        keyExtractor={(s) => s.id}
        isLoading={isLoading}
        emptyTitle="No subscribers found"
        emptyDescription="There are no subscribers matching the search query or active filter."
      />

      {/* Modular Registration Modal */}
      <SubscriberFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubscriber}
        packages={packages}
        routers={routers}
      />

      {/* Modular Suspend/Restore Service Status Dialog */}
      <ServiceStatusDialog
        isOpen={!!serviceStatusTarget}
        onClose={() => setServiceStatusTarget(null)}
        subscriber={serviceStatusTarget?.subscriber || null}
        targetAction={serviceStatusTarget?.action || 'SUSPEND'}
        onConfirm={handleConfirmStatusChange}
        isLoading={isStatusSubmitting}
      />
    </AppShell>
  );
}
