'use client';

import React from 'react';
import { CreditCard, RotateCcw, Wallet, TrendingUp } from 'lucide-react';
import { PaymentItem } from './billing.types';

interface PaymentStatsCardsProps {
  payments: PaymentItem[];
}

export const PaymentStatsCards: React.FC<PaymentStatsCardsProps> = ({ payments }) => {
  const confirmedPayments = payments.filter((p) => p.status === 'CONFIRMED');
  const reversedPayments = payments.filter((p) => p.status === 'REVERSED');

  const totalConfirmedMinor = confirmedPayments.reduce((acc, p) => acc + p.amountMinor, 0);
  const totalReversedMinor = reversedPayments.reduce((acc, p) => acc + p.amountMinor, 0);
  const netCollectedMinor = totalConfirmedMinor - totalReversedMinor;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Gross Confirmed */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Gross Collections
          </span>
          <CreditCard className="w-4 h-4 text-neutral-800" />
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">
          ৳ {(totalConfirmedMinor / 100).toFixed(2)}
        </div>
        <div className="text-xs text-neutral-500 mt-1">
          {confirmedPayments.length} confirmed transactions
        </div>
      </div>

      {/* Net Revenue */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Net Cash Flow
          </span>
          <TrendingUp className="w-4 h-4 text-neutral-800" />
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">
          ৳ {(netCollectedMinor / 100).toFixed(2)}
        </div>
        <div className="text-xs text-neutral-500 mt-1">
          After accounting for chargebacks
        </div>
      </div>

      {/* Reversed Volume */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Reversals
          </span>
          <RotateCcw className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">
          ৳ {(totalReversedMinor / 100).toFixed(2)}
        </div>
        <div className="text-xs text-neutral-500 mt-1">
          {reversedPayments.length} reversed transactions
        </div>
      </div>

      {/* Average Transaction */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Avg Collection
          </span>
          <Wallet className="w-4 h-4 text-neutral-400" />
        </div>
        <div className="text-2xl font-bold font-mono text-neutral-900">
          ৳{' '}
          {confirmedPayments.length > 0
            ? (totalConfirmedMinor / confirmedPayments.length / 100).toFixed(2)
            : '0.00'}
        </div>
        <div className="text-xs text-neutral-500 mt-1">Per confirmed transaction</div>
      </div>
    </div>
  );
};
