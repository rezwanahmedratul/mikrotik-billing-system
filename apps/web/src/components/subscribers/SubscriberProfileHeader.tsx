'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Shield,
  CreditCard,
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SubscriberDetail } from './subscribers.types';

interface SubscriberProfileHeaderProps {
  subscriber: SubscriberDetail;
  onRenew: () => void;
  isRenewing: boolean;
  onToggleStatus: (action: 'SUSPEND' | 'RESTORE') => void;
}

export function SubscriberProfileHeader({
  subscriber,
  onRenew,
  isRenewing,
  onToggleStatus,
}: SubscriberProfileHeaderProps) {
  const isSuspended =
    subscriber.currentSubscription?.status === 'SUSPENDED' ||
    subscriber.pppoeAccount?.isSuspended;

  const currentStatus = subscriber.currentSubscription?.status || 'PENDING';

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <Link
          href="/dashboard/subscribers"
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-black px-3.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 shadow-2xs transition hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Subscribers</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={onRenew}
            disabled={isRenewing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 dark:bg-white px-3.5 py-1.5 text-xs font-semibold text-white dark:text-black shadow-xs transition hover:bg-black dark:hover:bg-neutral-200 disabled:opacity-60"
          >
            {isRenewing && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            <span>Renew Subscription</span>
          </button>
          <button
            onClick={() => onToggleStatus(isSuspended ? 'RESTORE' : 'SUSPEND')}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition shadow-2xs ${
              isSuspended
                ? 'border-neutral-800 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black hover:bg-black dark:hover:bg-neutral-200'
                : 'border-neutral-300 dark:border-neutral-800 bg-white dark:bg-black text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900'
            }`}
          >
            <span>{isSuspended ? 'Restore Service' : 'Suspend Service'}</span>
          </button>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-black p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 dark:bg-white text-lg font-bold text-white dark:text-black shadow-xs">
              {subscriber.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-neutral-900 dark:text-white">{subscriber.fullName}</h1>
                <StatusBadge
                  status={currentStatus}
                  variant={
                    currentStatus === 'ACTIVE'
                      ? 'success'
                      : currentStatus === 'SUSPENDED'
                      ? 'error'
                      : 'warning'
                  }
                />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="font-mono font-medium text-neutral-700 dark:text-neutral-300">
                  {subscriber.accountNumber}
                </span>
                <span>&bull;</span>
                <span>Registered {new Date(subscriber.createdAt).toLocaleDateString()}</span>
                {subscriber.nidOrPassport && (
                  <>
                    <span>&bull;</span>
                    <span className="font-mono text-neutral-500 dark:text-neutral-400">NID: {subscriber.nidOrPassport}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Details Grid */}
        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-neutral-100 dark:border-neutral-800 pt-5 sm:grid-cols-3">
          <div className="flex items-center gap-2.5 text-xs">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300">
              <Phone className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Phone Hotline</div>
              <div className="font-mono font-medium text-neutral-900 dark:text-white">{subscriber.phone}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300">
              <Mail className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Email Address</div>
              <div className="truncate text-neutral-800 dark:text-neutral-200">{subscriber.email || 'None provided'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Installation Address</div>
              <div className="truncate text-neutral-800 dark:text-neutral-200">{subscriber.address || 'Standard premises'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
