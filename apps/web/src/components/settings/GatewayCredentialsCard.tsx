'use client';

import React from 'react';
import { CreditCard, Smartphone, MessageSquare, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { TenantSettingsData } from './settings.types';

interface GatewayCredentialsCardProps {
  settings: TenantSettingsData;
}

export function GatewayCredentialsCard({ settings }: GatewayCredentialsCardProps) {
  const gateways = [
    {
      name: 'bKash Merchant Checkout',
      category: 'MFS Gateway',
      icon: Smartphone,
      status: settings.bkashMerchantConfigured ? 'CONNECTED' : 'NOT CONFIGURED',
      description: 'Webhook endpoint listening on /webhooks/bkash with HMAC signature verification and auto-reconciliation',
      configured: settings.bkashMerchantConfigured,
    },
    {
      name: 'Nagad Direct Pay',
      category: 'MFS Gateway',
      icon: Smartphone,
      status: settings.nagadMerchantConfigured ? 'CONNECTED' : 'NOT CONFIGURED',
      description: 'Instant merchant payment confirmation via Nagad PGW v2 API integration',
      configured: settings.nagadMerchantConfigured,
    },
    {
      name: 'SSLCommerz Multi-Card',
      category: 'Card & Net Banking',
      icon: CreditCard,
      status: settings.sslcommerzConfigured ? 'CONNECTED' : 'NOT CONFIGURED',
      description: 'Visa, Mastercard, Amex, and Internet Banking gateway with IPN validation',
      configured: settings.sslcommerzConfigured,
    },
    {
      name: 'Onnorokom SMS Gateway',
      category: 'Bulk SMS Broadcast',
      icon: MessageSquare,
      status: settings.smsGatewayConfigured ? 'CONNECTED' : 'NOT CONFIGURED',
      description: 'High-throughput transactional SMS delivery for bill alerts, OTPs, and suspension notices',
      configured: settings.smsGatewayConfigured,
    },
  ];

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
      <div className="mb-5 border-b border-neutral-100 pb-4">
        <h2 className="text-sm font-semibold text-neutral-900">Payment Gateways & Integrations</h2>
        <p className="mt-0.5 text-xs text-neutral-500">
          Digital merchant accounts and automated settlement services with secret key masking
        </p>
      </div>

      <div className="space-y-3">
        {gateways.map((gw) => {
          const Icon = gw.icon;
          return (
            <div
              key={gw.name}
              className="flex flex-col justify-between gap-3 rounded-xl border border-neutral-200/80 p-4 transition hover:bg-neutral-50/50 sm:flex-row sm:items-center"
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-900">{gw.name}</span>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-mono text-neutral-600">
                      {gw.category}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-neutral-500">{gw.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    gw.configured
                      ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border border-neutral-200 bg-neutral-100 text-neutral-600'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      gw.configured ? 'bg-emerald-500' : 'bg-neutral-400'
                    }`}
                  />
                  <span>{gw.status}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
