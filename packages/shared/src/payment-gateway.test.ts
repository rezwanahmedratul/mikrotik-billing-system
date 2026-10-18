import { describe, it, expect } from 'vitest';
import {
  MockPaymentGatewayAdapter,
} from './mock-payment-gateway-adapter';
import { PaymentGatewayProvider } from './payment-gateway.interface';

describe('Payment Gateway Interface & Mock Adapter', () => {
  const secretKey = 'test-secret-salt-12345';
  const adapter = new MockPaymentGatewayAdapter(PaymentGatewayProvider.BKASH, secretKey);

  it('initiates a sandbox payment session with structured response', async () => {
    const res = await adapter.initiatePayment({
      tenantId: 'tenant-1',
      subscriberId: 'sub-1',
      amountMinor: 150000,
      currency: 'BDT',
      callbackUrl: 'http://localhost:3000/dashboard/payments',
    });

    expect(res.gatewayPaymentId).toMatch(/^GW-bkash-/);
    expect(res.checkoutUrl).toContain('checkout.sandbox.gateway/bkash');
    expect(res.amountMinor).toBe(150000);
    expect(res.currency).toBe('BDT');
    expect(res.provider).toBe(PaymentGatewayProvider.BKASH);
    expect(res.expiresAt).toBeDefined();
  });

  it('successfully verifies webhook with valid HMAC-SHA256 signature', async () => {
    const payload = JSON.stringify({
      eventId: 'evt-unique-101',
      eventType: 'payment.success',
      amountMinor: 150000,
      currency: 'BDT',
      transactionReference: 'TRX99887711',
      metadata: { invoiceId: 'inv-123', subscriberId: 'sub-456' },
    });

    const signature = MockPaymentGatewayAdapter.signPayload(payload, secretKey);

    const result = await adapter.verifyWebhook({
      provider: PaymentGatewayProvider.BKASH,
      rawBody: payload,
      headers: {
        'x-signature': signature,
      },
      secretKey,
    });

    expect(result.isValid).toBe(true);
    expect(result.eventId).toBe('evt-unique-101');
    expect(result.eventType).toBe('payment.success');
    expect(result.amountMinor).toBe(150000);
    expect(result.transactionReference).toBe('TRX99887711');
    expect(result.metadata?.invoiceId).toBe('inv-123');
  });

  it('rejects webhook with invalid signature', async () => {
    const payload = JSON.stringify({ eventId: 'evt-tampered', amountMinor: 50000 });
    const forgedSignature = 'bad-signature-string';

    const result = await adapter.verifyWebhook({
      provider: PaymentGatewayProvider.BKASH,
      rawBody: payload,
      headers: { 'x-signature': forgedSignature },
      secretKey,
    });

    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Invalid webhook signature');
  });

  it('rejects webhook when signature header is missing', async () => {
    const payload = JSON.stringify({ eventId: 'evt-no-sig', amountMinor: 50000 });

    const result = await adapter.verifyWebhook({
      provider: PaymentGatewayProvider.BKASH,
      rawBody: payload,
      headers: {},
      secretKey,
    });

    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Missing webhook signature header');
  });

  it('rejects malformed json payload even with valid HMAC', async () => {
    const rawBody = 'this is not valid json {{{';
    const signature = MockPaymentGatewayAdapter.signPayload(rawBody, secretKey);

    const result = await adapter.verifyWebhook({
      provider: PaymentGatewayProvider.BKASH,
      rawBody,
      headers: { 'x-signature': signature },
      secretKey,
    });

    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toContain('Malformed webhook JSON');
  });
});
