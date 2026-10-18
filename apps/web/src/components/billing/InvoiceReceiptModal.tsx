'use client';

import React from 'react';
import { Printer, Download, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { InvoiceItem } from './billing.types';

interface InvoiceReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceItem | null;
}

export function InvoiceReceiptModal({
  isOpen,
  onClose,
  invoice,
}: InvoiceReceiptModalProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = invoice.status === 'PAID';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice Receipt #${invoice.invoiceNumber}`}
      maxWidth="lg"
    >
      <div className="space-y-6 text-neutral-900 dark:text-neutral-100 print:text-black">
        {/* Actions Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg uppercase tracking-wider ${
                isPaid
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'border border-neutral-300 bg-neutral-100 text-neutral-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'
              }`}
            >
              {invoice.status}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Issued {new Date(invoice.issuedAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 dark:border-neutral-800 dark:bg-black dark:text-neutral-300 dark:hover:bg-neutral-900 text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
          </div>
        </div>

        {/* Invoice Header Details */}
        <div className="grid grid-cols-2 gap-6 text-xs">
          <div>
            <span className="font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
              Billed To
            </span>
            <div className="text-sm font-bold text-neutral-900 dark:text-white">{invoice.subscriberName}</div>
            <div className="font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">Account: {invoice.accountNumber}</div>
            <div className="font-mono text-neutral-500 dark:text-neutral-400">{invoice.subscriberPhone}</div>
          </div>

          <div className="text-right">
            <span className="font-semibold text-neutral-400 uppercase tracking-wider block mb-1">
              Invoice Statement
            </span>
            <div className="font-mono font-bold text-neutral-900 dark:text-white text-sm">
              #{invoice.invoiceNumber}
            </div>
            <div className="text-neutral-500 dark:text-neutral-400 mt-0.5">
              Cycle: {new Date(invoice.billingPeriodStart).toLocaleDateString()} -{' '}
              {new Date(invoice.billingPeriodEnd).toLocaleDateString()}
            </div>
            <div className="text-neutral-500 dark:text-neutral-400">
              Due Date: <span className="font-semibold font-mono">{new Date(invoice.dueDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 dark:bg-black border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4 text-center">Qty</th>
                <th className="py-2.5 px-4 text-right">Unit Rate</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
              {invoice.lines.map((line) => (
                <tr key={line.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40">
                  <td className="py-2.5 px-4 font-sans font-medium text-neutral-800 dark:text-neutral-200">
                    {line.description}
                  </td>
                  <td className="py-2.5 px-4 text-center">{line.quantity}</td>
                  <td className="py-2.5 px-4 text-right">{line.unitPriceFormatted}</td>
                  <td className="py-2.5 px-4 text-right font-semibold">{line.totalFormatted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex justify-end text-xs">
          <div className="w-64 space-y-2 font-mono">
            <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
              <span>Subtotal:</span>
              <span>৳ {(invoice.subtotalMinor / 100).toFixed(2)}</span>
            </div>
            {invoice.discountMinor > 0 && (
              <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                <span>Discount:</span>
                <span>- ৳ {(invoice.discountMinor / 100).toFixed(2)}</span>
              </div>
            )}
            {invoice.taxMinor > 0 && (
              <div className="flex justify-between text-neutral-500 dark:text-neutral-400">
                <span>Tax:</span>
                <span>+ ৳ {(invoice.taxMinor / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-neutral-900 dark:text-white pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <span>Total Amount:</span>
              <span>{invoice.totalFormatted}</span>
            </div>
            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
              <span>Amount Paid:</span>
              <span>{invoice.paidFormatted}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-neutral-900 dark:text-white pt-1 border-t border-dashed border-neutral-200 dark:border-neutral-800">
              <span>Balance Due:</span>
              <span className="font-mono font-bold text-neutral-900 dark:text-white">
                {invoice.balanceFormatted}
              </span>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="p-3 bg-neutral-50 dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs text-neutral-500 dark:text-neutral-400 italic">
            Note: {invoice.notes}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
}
