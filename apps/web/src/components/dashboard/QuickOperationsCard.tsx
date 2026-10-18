'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Router, UserPlus, CreditCard, ShieldCheck } from 'lucide-react';

export function QuickOperationsCard() {
  const operations = [
    {
      title: 'Add Router Gateway',
      description: 'Configure new CCR or hEX device via RouterOS API',
      href: '/dashboard/routers',
      icon: Router,
    },
    {
      title: 'Provision PPPoE Subscriber',
      description: 'Create credentials and assign speed package',
      href: '/dashboard/subscribers',
      icon: UserPlus,
    },
    {
      title: 'Collect & Record Payment',
      description: 'Record cash, bKash, or bank deposit against invoice',
      href: '/dashboard/invoices',
      icon: CreditCard,
    },
    {
      title: 'Manage Staff Access',
      description: 'Assign NOC operators and cashiers with RBAC',
      href: '/dashboard/staff',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs dark:border-neutral-800 dark:bg-black transition-colors">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">Quick Operations</h2>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">Frequently executed ISP actions</p>
      </div>

      <div className="space-y-2">
        {operations.map((op) => {
          const Icon = op.icon;
          return (
            <Link
              key={op.title}
              href={op.href}
              className="group flex items-center justify-between rounded-xl border border-neutral-200/80 p-3 transition hover:border-neutral-300 hover:bg-neutral-50/70 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-900/60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition group-hover:bg-neutral-900 group-hover:text-white dark:bg-neutral-900 dark:text-neutral-300 dark:group-hover:bg-white dark:group-hover:text-neutral-900">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-medium text-neutral-900 dark:text-white">{op.title}</div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400">{op.description}</div>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-neutral-400 transition group-hover:text-neutral-900 dark:text-neutral-500 dark:group-hover:text-white" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
