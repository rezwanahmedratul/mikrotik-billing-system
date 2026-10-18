'use client';

import React from 'react';
import { Radio, RefreshCw, CheckCircle2, AlertCircle, Shield, Server } from 'lucide-react';
import { SubscriberDetail } from './subscribers.types';

interface SubscriberNetworkCardProps {
  subscriber: SubscriberDetail;
  onReprovision: () => void;
  isReprovisioning: boolean;
}

export function SubscriberNetworkCard({
  subscriber,
  onReprovision,
  isReprovisioning,
}: SubscriberNetworkCardProps) {
  const pppoe = subscriber.pppoeAccount;

  return (
    <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-black p-6 shadow-xs">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900 dark:text-white">MikroTik PPPoE Network Secret</h2>
            {pppoe?.confirmedOnRouter ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-white">
                <CheckCircle2 className="h-3 w-3 text-white" />
                <span>Router Sync Confirmed</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
                <AlertCircle className="h-3 w-3 text-neutral-500" />
                <span>Pending Push</span>
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Provisioned credentials, assigned PPP speed profile, and router gateway bindings
          </p>
        </div>

        <button
          onClick={onReprovision}
          disabled={isReprovisioning}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-black px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 shadow-2xs transition hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isReprovisioning ? 'animate-spin' : ''}`} />
          <span>Force Reprovision</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/40 dark:bg-black p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">PPPoE Username</div>
          <div className="mt-1 font-mono text-xs font-bold text-neutral-900 dark:text-white">
            {pppoe?.username || '—'}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">PPP Profile</div>
          <div className="mt-1 font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            {pppoe?.pppProfile || 'default'}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Target RouterOS Gateway</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200">
            <Server className="h-3.5 w-3.5 text-neutral-400" />
            <span>{pppoe?.routerName || 'Core Gateway'}</span>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Last Pushed to Device</div>
          <div className="mt-1 font-mono text-xs text-neutral-500 dark:text-neutral-400">
            {pppoe?.lastProvisionedAt
              ? new Date(pppoe.lastProvisionedAt).toLocaleString()
              : 'Never'}
          </div>
        </div>
      </div>
    </div>
  );
}
