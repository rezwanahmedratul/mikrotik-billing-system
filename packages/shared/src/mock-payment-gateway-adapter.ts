import { createHmac } from 'node:crypto';
import {
  PaymentGatewayAdapter,
  PaymentGatewayProvider,
  PaymentInitiationRequest,
  PaymentInitiationResult,
  WebhookVerificationRequest,
  WebhookVerificationResult,
} from './payment-gateway.interface';

export class MockPaymentGatewayAdapter implements PaymentGatewayAdapter {
  readonly provider: string;
  private readonly defaultSecret: string;

  constructor(provider: string = PaymentGatewayProvider.SANDBOX_MOCK, secret: string = 'sandbox-webhook-secret-key-123') {
    this.provider = provider;
    this.defaultSecret = secret;
  }

  static signPayload(payloadString: string, secret: string): string {
    return createHmac('sha256', secret).update(payloadString).digest('hex');
  }

  async initiatePayment(req: PaymentInitiationRequest): Promise<PaymentInitiationResult> {
    const gatewayPaymentId = `GW-${this.provider.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const checkoutUrl = `https://checkout.sandbox.gateway/${this.provider.toLowerCase()}?paymentId=${gatewayPaymentId}&amount=${req.amountMinor}&callback=${encodeURIComponent(req.callbackUrl)}`;

    return {
      gatewayPaymentId,
      checkoutUrl,
      provider: this.provider,
      amountMinor: req.amountMinor,
      currency: req.currency,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    };
  }

  async verifyWebhook(req: WebhookVerificationRequest): Promise<WebhookVerificationResult> {
    const rawSignature =
      req.headers['x-signature'] ||
      req.headers['x-webhook-signature'] ||
      req.headers['x-bkash-signature'] ||
      req.headers['x-signature-sha256'];

    const signature = Array.isArray(rawSignature) ? rawSignature[0] : rawSignature;

    if (!signature) {
      return {
        isValid: false,
        provider: this.provider,
        eventId: 'unknown',
        eventType: 'unknown',
        errorMessage: 'Missing webhook signature header.',
        payload: null,
      };
    }

    const secret = req.secretKey || this.defaultSecret;
    const computedSignature = MockPaymentGatewayAdapter.signPayload(req.rawBody, secret);

    if (signature !== computedSignature) {
      return {
        isValid: false,
        provider: this.provider,
        eventId: 'unknown',
        eventType: 'unknown',
        errorMessage: 'Invalid webhook signature.',
        payload: null,
      };
    }

    try {
      const parsed = typeof req.rawBody === 'string' ? JSON.parse(req.rawBody) : req.rawBody;
      return {
        isValid: true,
        provider: this.provider,
        eventId: parsed.eventId || `evt-${Date.now()}`,
        eventType: parsed.eventType || 'payment.success',
        amountMinor: parsed.amountMinor,
        currency: parsed.currency || 'BDT',
        transactionReference: parsed.transactionReference || parsed.trxId || `TRX-${Date.now()}`,
        metadata: parsed.metadata,
        payload: parsed,
      };
    } catch {
      return {
        isValid: false,
        provider: this.provider,
        eventId: 'unknown',
        eventType: 'unknown',
        errorMessage: 'Malformed webhook JSON payload.',
        payload: null,
      };
    }
  }

  async queryPaymentStatus(gatewayPaymentId: string): Promise<{
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
    transactionReference?: string;
    amountMinor?: number;
  }> {
    return {
      status: 'CONFIRMED',
      transactionReference: `TRX-${gatewayPaymentId.slice(-6)}`,
    };
  }
}
