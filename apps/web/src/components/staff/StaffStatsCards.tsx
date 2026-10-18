import React from 'react';
import { Users, Shield, Radio, CreditCard } from 'lucide-react';
import { StaffMember } from './staff.types';

interface StaffStatsCardsProps {
  staff: StaffMember[];
}

export function StaffStatsCards({ staff }: StaffStatsCardsProps) {
  const totalStaff = staff.length;
  const admins = staff.filter((s) => s.role === 'ISP_ADMIN').length;
  const operators = staff.filter((s) => s.role === 'ISP_OPERATOR').length;
  const cashiers = staff.filter((s) => s.role === 'CASHIER').length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Staff */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Team
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            {totalStaff}
          </span>
          <span className="text-xs text-neutral-500">members</span>
        </div>
        <div className="mt-2 text-[11px] text-neutral-500">
          Tenant-scoped user memberships
        </div>
      </div>

      {/* Administrators */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            ISP Administrators
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
            <Shield className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            {admins}
          </span>
          <span className="text-xs text-neutral-500">privileged</span>
        </div>
        <div className="mt-2 text-[11px] text-neutral-500">
          Full management & financial authority
        </div>
      </div>

      {/* NOC / Operators */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Network Operators
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
            <Radio className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            {operators}
          </span>
          <span className="text-xs text-neutral-500">NOC staff</span>
        </div>
        <div className="mt-2 text-[11px] text-neutral-500">
          Router sync & subscriber provisioning
        </div>
      </div>

      {/* Cashiers */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Cashiers & Billing
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
            <CreditCard className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900">
            {cashiers}
          </span>
          <span className="text-xs text-neutral-500">cashiers</span>
        </div>
        <div className="mt-2 text-[11px] text-neutral-500">
          Invoice payment collection desk
        </div>
      </div>
    </div>
  );
}
