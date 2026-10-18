'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, CreditCard, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { InvoiceItem } from './billing.types';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceItem | null;
  onSubmit: (payload: {
    subscriberId: string;
    invoiceId: string;
    amountMinor: number;
    method: string;
    externalReference?: string;
    notes?: string;
  }) => Promise<string | void>;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  invoice,
  onSubmit,
}: RecordPaymentModalProps) {
  const [amountMajor, setAmountMajor] = useState('');
  const [method, setMethod] = useState('BKASH');
  const [externalReference, setExternalReference] = useState('');
  const [notes, setNotes] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (invoice && isOpen) {
      setAmountMajor((invoice.balanceMinor / 100).toFixed(2));
      setMethod('BKASH');
      setExternalReference('');
      setNotes('');
      setModalError('');
    }
  }, [invoice, isOpen]);

  if (!invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountMajor);
    if (isNaN(amount) || amount <= 0) {
      setModalError('Please enter a valid payment amount greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setModalError('');

    const err = await onSubmit({
      subscriberId: invoice.subscriberId,
      invoiceId: invoice.id,
      amountMinor: Math.round(amount * 100),
      method,
      externalReference: externalReference.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setIsSubmitting(false);
    if (err) {
      setModalError(err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment for ${invoice.invoiceNumber}`}
      description={`Subscriber: ${invoice.subscriberName} (${invoice.accountNumber})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {modalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{modalError}</span>
          </div>
        )}

        {/* Invoice balance card */}
        <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 flex items-center justify-between text-xs">
          <div>
            <span className="text-neutral-400 block mb-0.5">Remaining Balance</span>
            <span className="text-lg font-bold font-mono text-neutral-900">
              ৳ {(invoice.balanceMinor / 100).toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-neutral-400 block mb-0.5">Invoice Total</span>
            <span className="text-sm font-mono text-neutral-600">
              {invoice.totalFormatted}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Payment Method *
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
            >
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="ROCKET">Rocket</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="ONLINE_GATEWAY">Online Gateway</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
              Amount (BDT) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-neutral-400">
                ৳
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amountMajor}
                onChange={(e) => setAmountMajor(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-mono text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
            Transaction Reference / TrxID
          </label>
          <input
            type="text"
            value={externalReference}
            onChange={(e) => setExternalReference(e.target.value)}
            placeholder="e.g. 9J47A83K1P"
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-mono text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
            Notes / Remarks
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional cashier remarks..."
            className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 transition-colors"
          />
        </div>

        <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-xl transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5"
          >
            {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            Confirm Payment
          </button>
        </div>
      </form>
    </Modal>
  );
}
