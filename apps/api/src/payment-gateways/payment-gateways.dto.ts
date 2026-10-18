export class InitiateGatewayPaymentDto {
  subscriberId!: string;
  invoiceId?: string;
  amountMinor!: number;
  provider!: string; // 'BKASH' | 'NAGAD' | 'STRIPE' | 'SANDBOX_MOCK'
  callbackUrl!: string;
}

export interface GatewayPaymentInitiatedResponse {
  gatewayPaymentId: string;
  checkoutUrl: string;
  provider: string;
  amountMinor: number;
  amountFormatted: string;
  currency: string;
  expiresAt?: string;
}

export interface WebhookEventResponse {
  id: string;
  provider: string;
  eventId: string;
  eventType: string;
  isProcessed: boolean;
  processedAt?: string | null;
  createdAt: string;
}

export interface WebhookProcessResult {
  status: 'success' | 'already_processed' | 'rejected';
  eventId: string;
  paymentNumber?: string;
  message?: string;
}
