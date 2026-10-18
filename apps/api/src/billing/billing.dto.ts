import {
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from '@mikrotik-billing/shared';

export interface CreateInvoiceDto {
  subscriberId: string;
  subscriptionId?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  lines: {
    description: string;
    quantity: number;
    unitPriceMinor: number;
  }[];
  discountMinor?: number;
  taxMinor?: number;
  notes?: string;
}

export interface InvoiceQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  subscriberId?: string;
}

export interface RecordPaymentDto {
  subscriberId: string;
  invoiceId?: string; // Optional: allocate to specific invoice or FIFO to oldest unpaid
  amountMinor: number;
  method: PaymentMethod;
  externalReference?: string;
  notes?: string;
}

export interface BillingRunDto {
  isDryRun?: boolean;
  cycleStart?: string;
  cycleEnd?: string;
}

export interface InvoiceLineResponse {
  id: string;
  description: string;
  quantity: number;
  unitPriceMinor: number;
  totalMinor: number;
  unitPriceFormatted: string;
  totalFormatted: string;
}

export interface InvoiceResponse {
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
  status: InvoiceStatus;
  issuedAt: string;
  paidAt?: string | null;
  voidedAt?: string | null;
  notes?: string | null;
  lines: InvoiceLineResponse[];
}

export interface PaymentAllocationResponse {
  invoiceId: string;
  invoiceNumber: string;
  amountMinor: number;
  amountFormatted: string;
}

export interface PaymentResponse {
  id: string;
  tenantId: string;
  paymentNumber: string;
  subscriberId: string;
  subscriberName: string;
  accountNumber: string;
  amountMinor: number;
  amountFormatted: string;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  externalReference?: string | null;
  collectedBy?: string | null;
  notes?: string | null;
  paidAt: string;
  allocations: PaymentAllocationResponse[];
}

export interface BillingRunResponse {
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
