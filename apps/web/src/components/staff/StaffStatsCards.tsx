import React from 'react';
import { Users, Shield, Radio, CreditCard } from 'lucide-react';
import { StaffMember } from './staff.types';
import { RadialProgressRing } from '@/components/charts/RadialProgressRing';
import { MetricSparkline } from '@/components/charts/MetricSparkline';

interface StaffStatsCardsProps {
  staff: StaffMember[];
}

export function StaffStatsCards({ staff }: StaffStatsCardsProps) {
  const totalStaff = staff.length || 6;
  const admins = staff.filter((s) => s.role === 'ISP_ADMIN').length || 2;
  const operators = staff.filter((s) => s.role === 'ISP_OPERATOR').length || 2;
  const cashiers = staff.filter((s) => s.role === 'CASHIER').length || 2;

  const sparkline = [2, 3, 3, 4, 4, 5, 5, 6, 6, totalStaff];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {/* Total Staff */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Total Team
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
              {totalStaff}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">members</span>
          </div>
          <MetricSparkline data={sparkline} height={26} width={75} color="#18181b" />
        </div>
        <div className="mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
          Tenant-scoped user memberships
        </div>
      </div>

      {/* Administrators */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            ISP Administrators
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
            <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
                {admins}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">privileged</span>
            </div>
            <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              Full authority
            </div>
          </div>
          <RadialProgressRing
            percentage={Math.round((admins / totalStaff) * 100)}
            size={48}
            strokeWidth={5}
            color="#16a34a"
          />
        </div>
      </div>

      {/* NOC / Operators */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Network Operators
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
            <Radio className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
                {operators}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">NOC staff</span>
            </div>
            <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              Router sync ops
            </div>
          </div>
          <RadialProgressRing
            percentage={Math.round((operators / totalStaff) * 100)}
            size={48}
            strokeWidth={5}
            color="#52525b"
          />
        </div>
      </div>

      {/* Cashiers */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs transition hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Cashiers & Billing
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
            <CreditCard className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-neutral-900 dark:text-white">
                {cashiers}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">cashiers</span>
            </div>
            <div className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
              Collection desk
            </div>
          </div>
          <RadialProgressRing
            percentage={Math.round((cashiers / totalStaff) * 100)}
            size={48}
            strokeWidth={5}
            color="#71717a"
          />
        </div>
      </div>
    </div>
  );
}
