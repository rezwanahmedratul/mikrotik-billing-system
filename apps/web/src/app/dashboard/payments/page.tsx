'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchApi } from '@/lib/api';
import { PaymentItem } from '@/components/billing/billing.types';
import { PaymentStatsCards } from '@/components/billing/PaymentStatsCards';
import { PaymentFiltersBar } from '@/components/billing/PaymentFiltersBar';
import { ReconciliationReportModal } from '@/components/billing/ReconciliationReportModal';
import { WebhookAuditModal } from '@/components/billing/WebhookAuditModal';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [isReconciliationOpen, setIsReconciliationOpen] = useState(false);
  const [isWebhooksAuditOpen, setIsWebhooksAuditOpen] = useState(false);
  const [paymentToReverse, setPaymentToReverse] = useState<PaymentItem | null>(null);
  const [isReversing, setIsReversing] = useState(false);

  const loadPayments = async () => {
    setIsLoading(true);
    setErrorMessage('');

    const queryParams = new URLSearchParams();
    if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());

    const res = await fetchApi<PaymentItem[]>(`/payments?${queryParams.toString()}`);
    setIsLoading(false);

    if (res.error) {
      // Demo fallback
      setPayments([
        {
          id: 'pay-1',
          tenantId: 't-1',
          paymentNumber: 'PAY-00042',
          subscriberId: 'sub-1',
          subscriberName: 'Tanvir Hossain',
          accountNumber: 'SUB-1001',
          amountMinor: 120000,
          amountFormatted: 'BDT 1200.00',
          currency: 'BDT',
          method: 'BKASH',
          status: 'CONFIRMED',
          externalReference: 'TRX-BKASH-889922',
          collectedBy: 'Alice Operator',
          notes: 'bKash online merchant payment',
          paidAt: new Date().toISOString(),
          allocations: [
            {
              invoiceId: 'inv-1',
              invoiceNumber: 'INV-00101',
              amountMinor: 120000,
              amountFormatted: 'BDT 1200.00',
            },
          ],
        },
      ]);
    } else if (res.data) {
      setPayments(res.data);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [searchQuery]);

  const handleConfirmReverse = async () => {
    if (!paymentToReverse) return;
    setIsReversing(true);
    const res = await fetchApi(`/payments/${paymentToReverse.id}/reverse`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Operator chargeback reversal' }),
    });
    setIsReversing(false);
    setPaymentToReverse(null);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage(`Payment "${paymentToReverse.paymentNumber}" reversed and invoice balance restored.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadPayments();
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (methodFilter !== 'ALL' && p.method !== methodFilter) return false;
      return true;
    });
  }, [payments, statusFilter, methodFilter]);

  return (
    <AppShell
      title="Payments Ledger"
      description="Review collections across cash, bKash, and digital channels, audit transactions, and reconcile ledger balances."
    >
      {/* Alert Notifications */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl border border-neutral-200 bg-neutral-900 text-white flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-xs text-neutral-300 hover:text-white underline">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl border border-neutral-300 bg-neutral-100 text-neutral-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-neutral-900 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-xs text-neutral-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <PaymentStatsCards payments={payments} />

      {/* Filters & Actions Bar */}
      <PaymentFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        methodFilter={methodFilter}
        onMethodChange={setMethodFilter}
        isLoading={isLoading}
        onRefresh={loadPayments}
        onOpenReconciliation={() => setIsReconciliationOpen(true)}
        onOpenWebhooksAudit={() => setIsWebhooksAuditOpen(true)}
      />

      {/* Payments Table */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl shadow-xs overflow-hidden">
        <DataTable<PaymentItem>
          columns={[
            {
              key: 'payment',
              header: 'Payment # / Date',
              render: (p: PaymentItem) => (
                <div>
                  <span className="font-mono font-bold text-neutral-900">#{p.paymentNumber}</span>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    {new Date(p.paidAt).toLocaleString()}
                  </div>
                </div>
              ),
            },
            {
              key: 'subscriber',
              header: 'Subscriber',
              render: (p: PaymentItem) => (
                <div>
                  <Link
                    href={`/dashboard/subscribers/${p.subscriberId}`}
                    className="text-xs font-semibold text-neutral-900 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{p.subscriberName}</span>
                    <ExternalLink className="w-3 h-3 text-neutral-400" />
                  </Link>
                  <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Account: {p.accountNumber}
                  </div>
                </div>
              ),
            },
            {
              key: 'amount',
              header: 'Amount / Currency',
              render: (p: PaymentItem) => (
                <div>
                  <div className="text-xs font-mono font-bold text-neutral-900">
                    {p.amountFormatted}
                  </div>
                  <div className="text-[11px] text-neutral-400 font-mono mt-0.5">{p.currency}</div>
                </div>
              ),
            },
            {
              key: 'method',
              header: 'Method & Reference',
              render: (p: PaymentItem) => (
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800">
                    {p.method}
                  </span>
                  {p.externalReference && (
                    <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      Trx: {p.externalReference}
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: 'allocations',
              header: 'Allocated Invoices',
              render: (p: PaymentItem) => (
                <div>
                  {p.allocations && p.allocations.length > 0 ? (
                    p.allocations.map((a) => (
                      <div key={a.invoiceId} className="text-xs font-mono text-neutral-700">
                        #{a.invoiceNumber} ({a.amountFormatted})
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-400 italic">Unallocated balance</span>
                  )}
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (p: PaymentItem) => (
                <StatusBadge
                  status={p.status}
                  variant={p.status === 'CONFIRMED' ? 'success' : 'error'}
                />
              ),
            },
            {
              key: 'actions',
              header: 'Action',
              className: 'text-right',
              headerClassName: 'text-right',
              render: (p: PaymentItem) => (
                <div className="flex items-center justify-end">
                  {p.status === 'CONFIRMED' && (
                    <button
                      onClick={() => setPaymentToReverse(p)}
                      className="px-2.5 py-1 text-neutral-500 hover:text-red-700 hover:bg-neutral-100 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium"
                      title="Reverse Payment"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reverse</span>
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredPayments}
          keyExtractor={(p) => p.id}
          isLoading={isLoading}
          emptyTitle="No payments found"
          emptyDescription="There are no payments recorded matching your filter criteria."
        />
      </div>

      {/* Reconciliation Report Modal */}
      <ReconciliationReportModal
        isOpen={isReconciliationOpen}
        onClose={() => setIsReconciliationOpen(false)}
      />

      {/* Webhook Events Audit Modal */}
      <WebhookAuditModal
        isOpen={isWebhooksAuditOpen}
        onClose={() => setIsWebhooksAuditOpen(false)}
      />

      {/* Reverse Payment Confirmation */}
      <ConfirmDialog
        isOpen={!!paymentToReverse}
        onClose={() => setPaymentToReverse(null)}
        onConfirm={handleConfirmReverse}
        title={`Reverse Payment #${paymentToReverse?.paymentNumber}?`}
        message={`Are you sure you want to reverse this ${paymentToReverse?.amountFormatted} payment? This will restore the outstanding balances on allocated invoices.`}
        confirmLabel="Reverse Payment"
        isDestructive={true}
        isLoading={isReversing}
      />
    </AppShell>
  );
}
