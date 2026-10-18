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
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-neutral-900">MikroTik PPPoE Network Secret</h2>
            {pppoe?.confirmedOnRouter ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                <span>Router Sync Confirmed</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                <AlertCircle className="h-3 w-3 text-neutral-500" />
                <span>Pending Push</span>
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-neutral-500">
            Provisioned credentials, assigned PPP speed profile, and router gateway bindings
          </p>
        </div>

        <button
          onClick={onReprovision}
          disabled={isReprovisioning}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-neutral-200/80 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-2xs transition hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isReprovisioning ? 'animate-spin' : ''}`} />
          <span>Force Reprovision</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-neutral-200/70 bg-neutral-50/40 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">PPPoE Username</div>
          <div className="mt-1 font-mono text-xs font-bold text-neutral-900">
            {pppoe?.username || '—'}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">PPP Profile</div>
          <div className="mt-1 font-mono text-xs font-semibold text-neutral-800">
            {pppoe?.pppProfile || 'default'}
          </div>
        </div>

        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Target RouterOS Gateway</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-neutral-800">
            <Server className="h-3.5 w-3.5 text-neutral-400" />
            <span>{pppoe?.routerName || 'Core Gateway'}</span>
          </div>
        </div>

        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">Last Pushed to Device</div>
          <div className="mt-1 font-mono text-xs text-neutral-500">
            {pppoe?.lastProvisionedAt
              ? new Date(pppoe.lastProvisionedAt).toLocaleString()
              : 'Never'}
          </div>
        </div>
      </div>
    </div>
  );
}
