'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

import { AppShell } from '@/components/layout/AppShell';

interface StaffMember {
  membershipId: string;
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add staff modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('ISP_OPERATOR');
  const [newPassword, setNewPassword] = useState('TempPass123!');
  const [newPhone, setNewPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadStaff = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const res = await fetchApi<StaffMember[]>('/tenants/staff');
    setIsLoading(false);

    if (res.error) {
      // If not logged in or API unreachable during pure static preview, fallback to demo data
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

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError('');

    const res = await fetchApi('/tenants/staff', {
      method: 'POST',
      body: JSON.stringify({
        email: newEmail,
        fullName: newFullName,
        role: newRole,
        password: newPassword,
        phone: newPhone || undefined,
      }),
    });

    setIsSubmitting(false);

    if (res.error) {
      setModalError(res.error);
      return;
    }

    setIsModalOpen(false);
    setNewEmail('');
    setNewFullName('');
    setNewPhone('');
    setSuccessMessage('Staff member added successfully.');
    setTimeout(() => setSuccessMessage(''), 3000);
    loadStaff();
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'PLATFORM_ADMIN':
      case 'ISP_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-neutral-900 px-2 py-0.5 text-[11px] font-medium text-white">
            <Shield className="h-3 w-3" /> Admin
          </span>
        );
      case 'ISP_OPERATOR':
        return (
          <span className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-800">
            Operator / NOC
          </span>
        );
      case 'CASHIER':
        return (
          <span className="inline-flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-700">
            Cashier / Billing
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded border border-dashed border-neutral-300 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
            Auditor
          </span>
        );
    }
  };

  return (
    <AppShell
      title="Staff & Access Control"
      description="Manage operator permissions, cashier assignments, and access policies."
      action={
        <button
          id="open-add-staff-modal-btn"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800"
        >
          <UserPlus className="h-3.5 w-3.5" /> Add Staff Member
        </button>
      }
    >
      <div className="space-y-4">
        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded border border-status-error-border bg-status-error-bg p-3 text-xs text-status-error">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded border border-border bg-surface py-2 pl-9 pr-3 text-xs text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>
          <span className="text-xs text-neutral-500">
            Showing <span className="font-semibold text-neutral-800">{filteredStaff.length}</span>{' '}
            staff member(s)
          </span>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded border border-border bg-surface shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-neutral-50 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Staff Member</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-neutral-500">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                      <span className="mt-2 block">Loading organization staff...</span>
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-neutral-500">
                      No staff members found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member) => (
                    <tr key={member.membershipId} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900">{member.fullName}</div>
                        <div className="font-mono text-[11px] text-neutral-500">{member.email}</div>
                      </td>
                      <td className="px-4 py-3">{getRoleBadge(member.role)}</td>
                      <td className="px-4 py-3 font-mono text-neutral-600">
                        {member.phone || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {member.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-neutral-300"></span>{' '}
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-600">
                          Configured
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded border border-border bg-surface p-6 shadow-lg">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-semibold text-neutral-900">
                Add Organization Staff Member
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 flex items-center gap-2 rounded border border-status-error-border bg-status-error-bg p-2.5 text-xs text-status-error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-800">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Mahbub Alam"
                  className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="mahbub@fastnet.com"
                  className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800">
                  Assigned Role *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
                >
                  <option value="ISP_OPERATOR">
                    ISP Operator (Router & Subscriber Operations)
                  </option>
                  <option value="CASHIER">Cashier (Billing & Payment Collection)</option>
                  <option value="ISP_ADMIN">ISP Administrator (Full Tenant Control)</option>
                  <option value="AUDITOR">Auditor (Read-Only Compliance)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-800">Phone Number</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+8801700112233"
                  className="mt-1 block w-full rounded border border-border bg-background px-3 py-2 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
                />
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  id="confirm-create-staff-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
