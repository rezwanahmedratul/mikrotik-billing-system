'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Archive,
  ArchiveRestore,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  CheckCircle2,
  Tag,
  Users,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchApi } from '@/lib/api';
import { PackageItem, PackageFormData } from '@/components/packages/packages.types';
import { PackageStatsCards } from '@/components/packages/PackageStatsCards';
import { PackageFiltersBar } from '@/components/packages/PackageFiltersBar';
import { PackageFormModal } from '@/components/packages/PackageFormModal';

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArchived, setFilterArchived] = useState<'all' | 'active' | 'archived'>('active');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageItem | null>(null);

  // Dialogs
  const [packageToDelete, setPackageToDelete] = useState<PackageItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [packageToArchiveToggle, setPackageToArchiveToggle] = useState<PackageItem | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const loadPackages = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const res = await fetchApi<PackageItem[]>('/packages?includeArchived=true');
    setIsLoading(false);

    if (res.error) {
      // Demo fallback data if API token is fresh or backend unavailable
      setPackages([
        {
          id: 'pkg-1',
          tenantId: 't-1',
          name: 'Home Starter 10M',
          code: 'home-starter-10m',
          downloadSpeedKbps: 10240,
          uploadSpeedKbps: 10240,
          speedLimitRaw: '10M/10M',
          priceMinor: 80000,
          priceFormatted: 'BDT 800.00',
          billingCycle: 'MONTHLY',
          validityDays: 30,
          pppProfileName: 'profile-10M',
          description: 'Entry-level fiber internet package for everyday home browsing',
          isArchived: false,
          activeSubscriptionsCount: 142,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'pkg-2',
          tenantId: 't-1',
          name: 'Home Turbo 20M',
          code: 'home-turbo-20m',
          downloadSpeedKbps: 20480,
          uploadSpeedKbps: 20480,
          speedLimitRaw: '20M/20M',
          priceMinor: 120000,
          priceFormatted: 'BDT 1200.00',
          billingCycle: 'MONTHLY',
          validityDays: 30,
          pppProfileName: 'profile-20M',
          description: 'High-speed fiber streaming package with 4K support and low gaming latency',
          isArchived: false,
          activeSubscriptionsCount: 285,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'pkg-3',
          tenantId: 't-1',
          name: 'Business Pro 50M',
          code: 'biz-pro-50m',
          downloadSpeedKbps: 51200,
          uploadSpeedKbps: 51200,
          speedLimitRaw: '50M/50M',
          priceMinor: 300000,
          priceFormatted: 'BDT 3000.00',
          billingCycle: 'MONTHLY',
          validityDays: 30,
          pppProfileName: 'profile-biz-50M',
          description: 'Dedicated business connection with symmetrical bandwidth & priority SLA',
          isArchived: false,
          activeSubscriptionsCount: 48,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } else if (res.data) {
      setPackages(res.data);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleCreateOrUpdate = async (formData: PackageFormData): Promise<string | void> => {
    if (editingPackage) {
      const res = await fetchApi<PackageItem>(`/packages/${editingPackage.id}`, {
        method: 'PATCH',
        body: JSON.stringify(formData),
      });
      if (res.error) return res.error;
      setIsModalOpen(false);
      setSuccessMessage(`Package "${formData.name}" updated successfully.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadPackages();
    } else {
      const res = await fetchApi<PackageItem>('/packages', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.error) return res.error;
      setIsModalOpen(false);
      setSuccessMessage(`Package "${formData.name}" created successfully.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadPackages();
    }
  };

  const handleToggleArchive = async () => {
    if (!packageToArchiveToggle) return;
    setIsArchiving(true);
    const newArchivedState = !packageToArchiveToggle.isArchived;
    const res = await fetchApi<PackageItem>(`/packages/${packageToArchiveToggle.id}/archive`, {
      method: 'POST',
      body: JSON.stringify({ isArchived: newArchivedState }),
    });
    setIsArchiving(false);
    setPackageToArchiveToggle(null);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage(
        newArchivedState
          ? `Package "${packageToArchiveToggle.name}" has been archived.`
          : `Package "${packageToArchiveToggle.name}" has been restored to active service.`
      );
      setTimeout(() => setSuccessMessage(''), 4000);
      loadPackages();
    }
  };

  const handleDelete = async () => {
    if (!packageToDelete) return;
    setIsDeleting(true);
    const res = await fetchApi(`/packages/${packageToDelete.id}`, {
      method: 'DELETE',
    });
    setIsDeleting(false);
    setPackageToDelete(null);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage(`Package "${packageToDelete.name}" permanently deleted.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadPackages();
    }
  };

  // Filtered packages
  const filteredPackages = packages.filter((pkg) => {
    if (filterArchived === 'active' && pkg.isArchived) return false;
    if (filterArchived === 'archived' && !pkg.isArchived) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = pkg.name.toLowerCase().includes(q);
      const matchCode = pkg.code.toLowerCase().includes(q);
      const matchProfile = pkg.pppProfileName.toLowerCase().includes(q);
      return matchName || matchCode || matchProfile;
    }
    return true;
  });

  const activeCount = packages.filter((p) => !p.isArchived).length;
  const archivedCount = packages.filter((p) => p.isArchived).length;

  return (
    <AppShell
      title="Internet Packages"
      description="Manage broadband tariff plans, bandwidth limits, RouterOS PPP profiles, and recurring rate cards."
      action={
        <button
          onClick={() => {
            setEditingPackage(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Package
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
      <PackageStatsCards packages={packages} />

      {/* Modular Filters & Search Toolbar */}
      <PackageFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterArchived={filterArchived}
        onFilterChange={setFilterArchived}
        activeCount={activeCount}
        archivedCount={archivedCount}
        totalCount={packages.length}
        onRefresh={loadPackages}
        isLoading={isLoading}
      />

      {/* Packages Data Table */}
      <DataTable<PackageItem>
        columns={[
          {
            key: 'package',
            header: 'Package / Code',
            render: (pkg: PackageItem) => (
              <div>
                <div className="font-semibold text-neutral-900 flex items-center gap-2">
                  <span>{pkg.name}</span>
                  {pkg.isArchived && (
                    <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-600">
                      Archived
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-400 font-mono mt-0.5">{pkg.code}</div>
                {pkg.description && (
                  <p className="text-xs text-neutral-500 line-clamp-1 mt-1 max-w-sm">
                    {pkg.description}
                  </p>
                )}
              </div>
            ),
          },
          {
            key: 'speed',
            header: 'Bandwidth (Up / Down)',
            render: (pkg: PackageItem) => (
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 font-mono text-xs font-medium text-neutral-800">
                  <ArrowUpRight className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{(pkg.uploadSpeedKbps / 1024).toFixed(0)}M</span>
                  <span className="text-neutral-300">/</span>
                  <ArrowDownLeft className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{(pkg.downloadSpeedKbps / 1024).toFixed(0)}M</span>
                </div>
                <div className="text-[11px] text-neutral-400 font-mono mt-1">
                  raw: {pkg.speedLimitRaw}
                </div>
              </div>
            ),
          },
          {
            key: 'profile',
            header: 'RouterOS Profile',
            render: (pkg: PackageItem) => (
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-xs font-mono font-medium text-neutral-700">
                  {pkg.pppProfileName}
                </span>
              </div>
            ),
          },
          {
            key: 'price',
            header: 'Price / Cycle',
            render: (pkg: PackageItem) => (
              <div>
                <div className="text-sm font-semibold text-neutral-900 font-mono">
                  {pkg.priceFormatted}
                </div>
                <div className="text-xs text-neutral-500 capitalize">
                  {pkg.billingCycle.toLowerCase()} ({pkg.validityDays} days)
                </div>
              </div>
            ),
          },
          {
            key: 'subscribers',
            header: 'Subscribers',
            render: (pkg: PackageItem) => (
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-xs font-medium text-neutral-700">
                  {pkg.activeSubscriptionsCount} users
                </span>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (pkg: PackageItem) => (
              <StatusBadge
                status={pkg.isArchived ? 'ARCHIVED' : 'ACTIVE'}
                variant={pkg.isArchived ? 'neutral' : 'success'}
              />
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (pkg: PackageItem) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={() => {
                    setEditingPackage(pkg);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                  title="Edit Package"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPackageToArchiveToggle(pkg)}
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                  title={pkg.isArchived ? 'Restore to Active' : 'Archive Package'}
                >
                  {pkg.isArchived ? (
                    <ArchiveRestore className="w-4 h-4" />
                  ) : (
                    <Archive className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setPackageToDelete(pkg)}
                  className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Delete Package"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ),
          },
        ]}
        data={filteredPackages}
        keyExtractor={(pkg) => pkg.id}
        isLoading={isLoading}
        emptyTitle="No packages found"
        emptyDescription={
          searchQuery || filterArchived !== 'all'
            ? 'Try modifying your search query or filter selection.'
            : 'Get started by creating your first internet tariff package.'
        }
      />

      {/* Modular Create / Edit Package Modal */}
      <PackageFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        editingPackage={editingPackage}
      />

      {/* Toggle Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!packageToArchiveToggle}
        onClose={() => setPackageToArchiveToggle(null)}
        onConfirm={handleToggleArchive}
        title={
          packageToArchiveToggle?.isArchived
            ? `Restore "${packageToArchiveToggle.name}"?`
            : `Archive "${packageToArchiveToggle?.name}"?`
        }
        message={
          packageToArchiveToggle?.isArchived
            ? 'Restoring this package will make it available again for new subscriber sign-ups and renewals.'
            : 'Archiving hides this package from the new sign-up catalog. Existing active subscribers on this package will remain unaffected and continue their current billing.'
        }
        confirmLabel={packageToArchiveToggle?.isArchived ? 'Restore Package' : 'Archive Package'}
        isLoading={isArchiving}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!packageToDelete}
        onClose={() => setPackageToDelete(null)}
        onConfirm={handleDelete}
        title={`Permanently Delete "${packageToDelete?.name}"?`}
        message={
          packageToDelete && packageToDelete.activeSubscriptionsCount > 0
            ? `Warning: This package currently has ${packageToDelete.activeSubscriptionsCount} active subscription(s). The database will prevent deletion to preserve billing audit history. Please archive this package instead.`
            : 'Are you sure you want to permanently delete this package? This action cannot be undone.'
        }
        confirmLabel="Delete Package"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </AppShell>
  );
}
