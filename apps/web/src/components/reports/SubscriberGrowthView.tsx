'use client';

import React from 'react';
import { Users, UserPlus, Package as PackageIcon, Router as RouterIcon } from 'lucide-react';
import { SubscriberGrowthData } from './reports.types';

interface SubscriberGrowthViewProps {
  data: SubscriberGrowthData | null;
  isLoading: boolean;
}

export function SubscriberGrowthView({ data, isLoading }: SubscriberGrowthViewProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center text-xs text-neutral-500">
        Loading subscriber distribution metrics...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-12 text-center text-xs text-neutral-500">
        No subscriber metrics available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Total Subscribers
            </span>
            <Users className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900">{data.totalCount}</div>
          <div className="text-xs text-neutral-500 mt-1">All registered accounts</div>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Active Online
            </span>
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">{data.activeCount}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Authorized with active secret</div>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Suspended (Cutoff)
            </span>
            <div className="h-2 w-2 rounded-full bg-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600">{data.suspendedCount}</div>
          <div className="text-xs text-rose-600 font-medium mt-1">Non-payment or administrative lock</div>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              New Registrations
            </span>
            <UserPlus className="h-4 w-4 text-neutral-900" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-900">
            {data.newSubscribersInPeriod}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Within selected period</div>
        </div>
      </div>

      {/* Two Column Breakdown: Package Plans & Router Gateway Deployments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Package */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">Tariff Package Adoption</h3>
            <p className="text-xs text-neutral-500">Active subscriber subscriptions by speed tier</p>
          </div>

          <div className="space-y-3">
            {data.byPackage.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-500">No package data</div>
            ) : (
              data.byPackage.map((pkg) => {
                const total = data.activeCount || 1;
                const percentage = Math.round((pkg.count / total) * 100);

                return (
                  <div key={pkg.packageId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <PackageIcon className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="font-medium text-neutral-900">{pkg.packageName}</span>
                        <span className="font-mono text-[10px] text-neutral-500">
                          ({pkg.speedDesc})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-neutral-900">{pkg.count}</span>
                        <span className="font-mono text-[10px] text-neutral-400">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-900"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* By Router Gateway */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">Router Gateway Loading</h3>
            <p className="text-xs text-neutral-500">PPPoE subscriber secrets assigned per device</p>
          </div>

          <div className="space-y-3">
            {data.byRouter.length === 0 ? (
              <div className="py-6 text-center text-xs text-neutral-500">No router data</div>
            ) : (
              data.byRouter.map((r) => {
                const total = data.totalCount || 1;
                const percentage = Math.round((r.count / total) * 100);

                return (
                  <div key={r.routerId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <RouterIcon className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="font-medium text-neutral-900">{r.routerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-neutral-900">{r.count} users</span>
                        <span className="font-mono text-[10px] text-neutral-400">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-800"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
