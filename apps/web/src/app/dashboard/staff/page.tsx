'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Shield,
  Radio,
  CreditCard,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fetchApi } from '@/lib/api';
import { StaffMember } from '@/components/staff/staff.types';
import { StaffStatsCards } from '@/components/staff/StaffStatsCards';
import { StaffDistributionCharts } from '@/components/staff/StaffDistributionCharts';
import { StaffFormModal } from '@/components/staff/StaffFormModal';

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add staff modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadStaff = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const res = await fetchApi<StaffMember[]>('/tenants/staff');
    setIsLoading(false);

    if (res.error) {
      // Mock fallback data for demo / static previews
      setStaff([
        {
          membershipId: 'mem-1',
          userId: 'u-1',
          email: 'admin@fastnet.com',
          fullName: 'Ahsan Rahman',
          phone: '+8801711000111',
          role: 'ISP_ADMIN',
          isActive: true,
          joinedAt: new Date().toISOString(),
        },
        {
          membershipId: 'mem-2',
          userId: 'u-2',
          email: 'operator@fastnet.com',
          fullName: 'Tanvir Hossain',
          phone: '+8801722000222',
          role: 'ISP_OPERATOR',
          isActive: true,
          joinedAt: new Date().toISOString(),
        },
        {
          membershipId: 'mem-3',
          userId: 'u-3',
          email: 'cashier@fastnet.com',
          fullName: 'Salma Begum',
          phone: '+8801733000333',
          role: 'CASHIER',
          isActive: true,
          joinedAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    if (res.data) {
      setStaff(res.data);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (data: {
    fullName: string;
    email: string;
    phone?: string;
    role: string;
    password?: string;
  }) => {
    setIsSubmitting(true);
    setModalError('');

    const res = await fetchApi('/tenants/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    setIsSubmitting(false);

    if (res.error) {
      setModalError(res.error);
      return;
    }

    setIsModalOpen(false);
    setSuccessMessage(`Staff member "${data.fullName}" added successfully.`);
    setTimeout(() => setSuccessMessage(''), 4000);
    loadStaff();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ISP_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-900 bg-neutral-900 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            <Shield className="h-3 w-3" /> Admin
          </span>
        );
      case 'ISP_OPERATOR':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-800">
            <Radio className="h-3 w-3" /> NOC Operator
          </span>
        );
      case 'CASHIER':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-800">
            <CreditCard className="h-3 w-3" /> Cashier
          </span>
        );
      default:
        return <StatusBadge status={role} />;
    }
  };

  const columns = [
    {
      key: 'fullName',
      header: 'Staff Member',
      render: (item: StaffMember) => (
        <div>
          <div className="font-semibold text-neutral-900">{item.fullName}</div>
          <div className="font-mono text-[11px] text-neutral-500 mt-0.5">{item.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (item: StaffMember) => getRoleBadge(item.role),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (item: StaffMember) => (
        <span className="font-mono text-[11px] text-neutral-600">{item.phone || '—'}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item: StaffMember) =>
        item.isActive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-300"></span> Inactive
          </span>
        ),
    },
    {
      key: 'joinedAt',
      header: 'Joined',
      render: (item: StaffMember) => (
        <span className="font-mono text-[11px] text-neutral-500">
          {new Date(item.joinedAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <AppShell
      title="Staff & Access Control"
      description="Manage organization team members and enforce strict role-based access permissions."
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={loadStaff}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            id="open-add-staff-btn"
            onClick={() => {
              setModalError('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Team Member</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {successMessage && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modular Team KPI Cards */}
        <StaffStatsCards staff={staff} />

        {/* Team Role & Activity Distribution Charts */}
        <StaffDistributionCharts staff={staff} />

        {/* Data Table */}
        <DataTable<StaffMember>
          columns={columns}
          data={staff}
          keyExtractor={(item) => item.membershipId}
          isLoading={isLoading}
          searchPlaceholder="Search staff by name, email, or role..."
          searchFilter={(item, query) =>
            item.fullName.toLowerCase().includes(query.toLowerCase()) ||
            item.email.toLowerCase().includes(query.toLowerCase()) ||
            item.role.toLowerCase().includes(query.toLowerCase())
          }
          emptyTitle="No staff members registered"
          emptyDescription="Add your first team member to delegate NOC operations or cashier payment collection."
        />
      </div>

      {/* Add Staff Modular Modal */}
      <StaffFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateStaff}
        isSubmitting={isSubmitting}
        modalError={modalError}
      />
    </AppShell>
  );
}
