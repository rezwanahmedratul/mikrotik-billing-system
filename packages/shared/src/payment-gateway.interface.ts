export enum PaymentGatewayProvider {
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  STRIPE = 'STRIPE',
  SSLCOMMERZ = 'SSLCOMMERZ',
  SANDBOX_MOCK = 'SANDBOX_MOCK',
}

export interface PaymentInitiationRequest {
  tenantId: string;
  subscriberId: string;
  invoiceId?: string;
  amountMinor: number;
  currency: string;
  customerPhone?: string;
  customerEmail?: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}

export interface PaymentInitiationResult {
  gatewayPaymentId: string;
  checkoutUrl: string;
  provider: PaymentGatewayProvider | string;
  amountMinor: number;
  currency: string;
  expiresAt?: string;
}

export interface WebhookVerificationRequest {
  provider: string;
  rawBody: string;
  headers: Record<string, string | string[] | undefined>;
  secretKey: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  provider: string;
  eventId: string;
  eventType: string;
  amountMinor?: number;
  currency?: string;
  transactionReference?: string;
  metadata?: Record<string, any>;
  errorMessage?: string;
  payload: any;
}

export interface PaymentGatewayAdapter {
  readonly provider: PaymentGatewayProvider | string;
  initiatePayment(req: PaymentInitiationRequest): Promise<PaymentInitiationResult>;
  verifyWebhook(req: WebhookVerificationRequest): Promise<WebhookVerificationResult>;
  queryPaymentStatus(gatewayPaymentId: string): Promise<{
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
    transactionReference?: string;
    amountMinor?: number;
  }>;
}
