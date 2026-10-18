export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
  unitPriceFormatted: string;
  totalFormatted: string;
}

export interface InvoiceItem {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  subscriberId: string;
  subscriberName: string;
  subscriberPhone: string;
  accountNumber: string;
  packageName?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  subtotalMinor: number;
  discountMinor: number;
  taxMinor: number;
  totalMinor: number;
  paidAmountMinor: number;
  balanceMinor: number;
  totalFormatted: string;
  paidFormatted: string;
  balanceFormatted: string;
  status: string;
  issuedAt: string;
  paidAt?: string | null;
  voidedAt?: string | null;
  notes?: string | null;
  lines: InvoiceLineItem[];
}

export interface PaymentAllocationItem {
  invoiceId: string;
  invoiceNumber: string;
  amountMinor: number;
  amountFormatted: string;
}

export interface PaymentItem {
  id: string;
  tenantId: string;
  paymentNumber: string;
  subscriberId: string;
  subscriberName: string;
  accountNumber: string;
  amountMinor: number;
  amountFormatted: string;
  currency: string;
  method: string;
  status: string;
  externalReference?: string | null;
  collectedBy?: string | null;
  notes?: string | null;
  paidAt: string;
  allocations: PaymentAllocationItem[];
}

export interface BillingRunItem {
  id: string;
  tenantId: string;
  executionDate: string;
  cycleStart: string;
  cycleEnd: string;
  invoicesGenerated: number;
  totalBilledMinor: number;
  totalBilledFormatted: string;
  status: string;
  isDryRun: boolean;
  triggeredBy?: string | null;
}

export interface MethodBreakdownItem {
  method: string;
  count: number;
  totalMinor: number;
  totalFormatted: string;
}

export interface CollectorBreakdownItem {
  collector: string;
  count: number;
  totalMinor: number;
  totalFormatted: string;
}

export interface ReconciliationReportItem {
  periodStart: string;
  periodEnd: string;
  totalConfirmedMinor: number;
  totalReversedMinor: number;
  netCollectedMinor: number;
  totalConfirmedFormatted: string;
  totalReversedFormatted: string;
  netCollectedFormatted: string;
  paymentsCount: number;
  reversedCount: number;
  byMethod: MethodBreakdownItem[];
  byCollector: CollectorBreakdownItem[];
}
