'use client';

import React from 'react';
import { Package as PackageIcon, Zap, Archive, Users } from 'lucide-react';
import { PackageItem } from './packages.types';

interface PackageStatsCardsProps {
  packages: PackageItem[];
}

export function PackageStatsCards({ packages }: PackageStatsCardsProps) {
  const activeCount = packages.filter((p) => !p.isArchived).length;
  const archivedCount = packages.filter((p) => p.isArchived).length;
  const totalSubscribers = packages.reduce((acc, p) => acc + (p.activeSubscriptionsCount || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Total Packages
          </span>
          <PackageIcon className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-bold text-neutral-900">{packages.length}</div>
        <div className="text-xs text-neutral-500 mt-1">Configured service tiers</div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Active Plans
          </span>
          <Zap className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold text-neutral-900">{activeCount}</div>
        <div className="text-xs text-emerald-600 font-medium mt-1">Available for new sales</div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Archived Plans
          </span>
          <Archive className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-bold text-neutral-900">{archivedCount}</div>
        <div className="text-xs text-neutral-500 mt-1">Grandfathered or retired</div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Subscribed Users
          </span>
          <Users className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-bold text-neutral-900">{totalSubscribers}</div>
        <div className="text-xs text-neutral-500 mt-1">Active subscriber assignments</div>
      </div>
    </div>
  );
}
