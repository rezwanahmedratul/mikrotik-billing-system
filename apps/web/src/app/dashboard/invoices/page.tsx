'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Receipt,
  Plus,
  RefreshCw,
  Printer,
  CreditCard,
  Ban,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { fetchApi } from '@/lib/api';
import { InvoiceItem } from '@/components/billing/billing.types';
import { InvoiceStatsCards } from '@/components/billing/InvoiceStatsCards';
import { InvoiceFiltersBar } from '@/components/billing/InvoiceFiltersBar';
import { RecordPaymentModal } from '@/components/billing/RecordPaymentModal';
import { InvoiceReceiptModal } from '@/components/billing/InvoiceReceiptModal';
import { OnlinePaymentModal } from '@/components/billing/OnlinePaymentModal';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<InvoiceItem | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<InvoiceItem | null>(null);
  const [selectedInvoiceForOnlinePay, setSelectedInvoiceForOnlinePay] = useState<InvoiceItem | null>(null);
  const [invoiceToVoid, setInvoiceToVoid] = useState<InvoiceItem | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  const loadInvoices = async () => {
    setIsLoading(true);
    setErrorMessage('');

    const queryParams = new URLSearchParams();
    if (searchQuery.trim()) queryParams.set('search', searchQuery.trim());
    if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);

    const res = await fetchApi<{ data: InvoiceItem[]; meta: { total: number } }>(
      `/invoices?${queryParams.toString()}`
    );
    setIsLoading(false);

    if (res.error) {
      // Demo fallback data
      setInvoices([
        {
          id: 'inv-1',
          tenantId: 't-1',
          invoiceNumber: 'INV-00101',
          subscriberId: 'sub-1',
          subscriberName: 'Tanvir Hossain',
          subscriberPhone: '01711002233',
          accountNumber: 'SUB-1001',
          packageName: 'Home Turbo 20M',
          billingPeriodStart: new Date('2026-10-01').toISOString(),
          billingPeriodEnd: new Date('2026-10-31').toISOString(),
          dueDate: new Date('2026-10-10').toISOString(),
          subtotalMinor: 120000,
          discountMinor: 0,
          taxMinor: 0,
          totalMinor: 120000,
          paidAmountMinor: 120000,
          balanceMinor: 0,
          totalFormatted: 'BDT 1200.00',
          paidFormatted: 'BDT 1200.00',
          balanceFormatted: 'BDT 0.00',
          status: 'PAID',
          issuedAt: new Date('2026-10-01').toISOString(),
          paidAt: new Date('2026-10-05').toISOString(),
          lines: [
            {
              id: 'line-1',
              description: 'Home Turbo 20M (20M/20M) Monthly Subscription',
              quantity: 1,
              unitPriceMinor: 120000,
              totalMinor: 120000,
              unitPriceFormatted: 'BDT 1200.00',
              totalFormatted: 'BDT 1200.00',
            },
          ],
        },
        {
          id: 'inv-2',
          tenantId: 't-1',
          invoiceNumber: 'INV-00102',
          subscriberId: 'sub-2',
          subscriberName: 'Farhana Ahmed',
          subscriberPhone: '01899887766',
          accountNumber: 'SUB-1002',
          packageName: 'Home Starter 10M',
          billingPeriodStart: new Date('2026-10-01').toISOString(),
          billingPeriodEnd: new Date('2026-10-31').toISOString(),
          dueDate: new Date('2026-10-10').toISOString(),
          subtotalMinor: 80000,
          discountMinor: 0,
          taxMinor: 0,
          totalMinor: 80000,
          paidAmountMinor: 0,
          balanceMinor: 80000,
          totalFormatted: 'BDT 800.00',
          paidFormatted: 'BDT 0.00',
          balanceFormatted: 'BDT 800.00',
          status: 'OVERDUE',
          issuedAt: new Date('2026-10-01').toISOString(),
          lines: [
            {
              id: 'line-2',
              description: 'Home Starter 10M (10M/10M) Monthly Subscription',
              quantity: 1,
              unitPriceMinor: 80000,
              totalMinor: 80000,
              unitPriceFormatted: 'BDT 800.00',
              totalFormatted: 'BDT 800.00',
            },
          ],
        },
      ]);
    } else if (res.data) {
      setInvoices(res.data.data);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [searchQuery, statusFilter]);

  const handleRecordPayment = async (payload: {
    subscriberId: string;
    invoiceId: string;
    amountMinor: number;
    method: string;
    externalReference?: string;
    notes?: string;
  }) => {
    const res = await fetchApi('/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.error) {
      return res.error;
    }

    setSelectedInvoiceForPayment(null);
    setSuccessMessage('Payment successfully recorded and allocated.');
    setTimeout(() => setSuccessMessage(''), 4000);
    loadInvoices();
  };

  const handleConfirmVoid = async () => {
    if (!invoiceToVoid) return;
    setIsVoiding(true);
    const res = await fetchApi(`/invoices/${invoiceToVoid.id}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Operator requested cancellation' }),
    });
    setIsVoiding(false);
    setInvoiceToVoid(null);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage(`Invoice "${invoiceToVoid.invoiceNumber}" was voided.`);
      setTimeout(() => setSuccessMessage(''), 4000);
      loadInvoices();
    }
  };

  return (
    <AppShell
      title="Invoices & Statements"
      description="Track recurring broadband subscription billings, review statements, record payments, and print receipts."
    >
      {/* Alert Notifications */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-2xl border border-emerald-950/20 bg-emerald-50 text-emerald-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-xs text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl border border-red-950/20 bg-red-50 text-red-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage('')} className="text-xs text-red-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Modular KPI Summary Cards */}
      <InvoiceStatsCards invoices={invoices} />

      {/* Modular Toolbar & Filter */}
      <InvoiceFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        onRefresh={loadInvoices}
        isLoading={isLoading}
      />

      {/* Invoices Table */}
      <DataTable<InvoiceItem>
        columns={[
          {
            key: 'invoice',
            header: 'Invoice # / Issue Date',
            render: (inv: InvoiceItem) => (
              <div>
                <button
                  onClick={() => setSelectedInvoiceForReceipt(inv)}
                  className="font-mono font-bold text-neutral-900 hover:underline flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5 text-neutral-400" />
                  <span>#{inv.invoiceNumber}</span>
                </button>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Issued: {new Date(inv.issuedAt).toLocaleDateString()}
                </div>
              </div>
            ),
          },
          {
            key: 'client',
            header: 'Subscriber',
            render: (inv: InvoiceItem) => (
              <div>
                <Link
                  href={`/dashboard/subscribers/${inv.subscriberId}`}
                  className="text-xs font-semibold text-neutral-900 hover:underline inline-flex items-center gap-1"
                >
                  <span>{inv.subscriberName}</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </Link>
                <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                  {inv.accountNumber} • {inv.subscriberPhone}
                </div>
              </div>
            ),
          },
          {
            key: 'period',
            header: 'Billing Cycle / Due Date',
            render: (inv: InvoiceItem) => (
              <div>
                <div className="text-xs text-neutral-700 font-mono">
                  {new Date(inv.billingPeriodStart).toLocaleDateString()} -{' '}
                  {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  Due: <span className="font-semibold text-neutral-600">{new Date(inv.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            ),
          },
          {
            key: 'amount',
            header: 'Total / Paid',
            render: (inv: InvoiceItem) => (
              <div>
                <div className="text-xs font-mono font-bold text-neutral-900">
                  {inv.totalFormatted}
                </div>
                <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                  Paid: {inv.paidFormatted}
                </div>
              </div>
            ),
          },
          {
            key: 'balance',
            header: 'Balance Due',
            render: (inv: InvoiceItem) => (
              <div
                className={`text-xs font-mono font-bold ${
                  inv.balanceMinor > 0 ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {inv.balanceFormatted}
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (inv: InvoiceItem) => (
              <StatusBadge
                status={inv.status}
                variant={
                  inv.status === 'PAID'
                    ? 'success'
                    : inv.status === 'PARTIALLY_PAID' || inv.status === 'ISSUED'
                    ? 'warning'
                    : inv.status === 'VOID'
                    ? 'neutral'
                    : 'error'
                }
              />
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            headerClassName: 'text-right',
            render: (inv: InvoiceItem) => (
              <div className="flex items-center justify-end gap-1.5">
                <button
                  onClick={() => setSelectedInvoiceForReceipt(inv)}
                  className="px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1"
                  title="View Printable Statement"
                >
                  <Printer className="w-3 h-3" />
                  <span>Receipt</span>
                </button>

                {inv.balanceMinor > 0 && inv.status !== 'VOID' && (
                  <>
                    <button
                      onClick={() => setSelectedInvoiceForOnlinePay(inv)}
                      className="px-2 py-1 text-xs font-medium text-neutral-800 hover:text-black bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors flex items-center gap-1"
                      title="Pay via Online Gateway (bKash/Nagad/Cards)"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Online</span>
                    </button>
                    <button
                      onClick={() => setSelectedInvoiceForPayment(inv)}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      title="Record payment"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Pay</span>
                    </button>
                  </>
                )}

                {inv.paidAmountMinor === 0 && inv.status !== 'VOID' && (
                  <button
                    onClick={() => setInvoiceToVoid(inv)}
                    className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Void Invoice"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ),
          },
        ]}
        data={invoices}
        keyExtractor={(inv) => inv.id}
        isLoading={isLoading}
        emptyTitle="No invoices found"
        emptyDescription="There are no billing invoices matching your query."
      />

      {/* Modular Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!selectedInvoiceForPayment}
        onClose={() => setSelectedInvoiceForPayment(null)}
        invoice={selectedInvoiceForPayment}
        onSubmit={handleRecordPayment}
      />

      {/* Modular Printable Receipt Modal */}
      <InvoiceReceiptModal
        isOpen={!!selectedInvoiceForReceipt}
        onClose={() => setSelectedInvoiceForReceipt(null)}
        invoice={selectedInvoiceForReceipt}
      />

      {/* Online Gateway Payment Modal */}
      <OnlinePaymentModal
        isOpen={!!selectedInvoiceForOnlinePay}
        onClose={() => setSelectedInvoiceForOnlinePay(null)}
        invoice={selectedInvoiceForOnlinePay}
        onPaymentSuccess={(msg) => {
          setSuccessMessage(msg);
          setTimeout(() => setSuccessMessage(''), 5000);
          loadInvoices();
        }}
      />

      {/* Void Invoice Confirmation */}
      <ConfirmDialog
        isOpen={!!invoiceToVoid}
        onClose={() => setInvoiceToVoid(null)}
        onConfirm={handleConfirmVoid}
        title={`Void Invoice #${invoiceToVoid?.invoiceNumber}?`}
        message="Are you sure you want to void this invoice? This will cancel the receivable and remove it from outstanding balances."
        confirmLabel="Void Invoice"
        isDestructive={true}
        isLoading={isVoiding}
      />
    </AppShell>
  );
}
