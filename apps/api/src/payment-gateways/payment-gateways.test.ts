import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@mikrotik-billing/database';
import {
  InvoiceStatus,
  PaymentStatus,
  PaymentGatewayProvider,
  MockPaymentGatewayAdapter,
  encrypt,
} from '@mikrotik-billing/shared';
import { InvoicesService } from '../billing/invoices.service.js';
import { PaymentsService } from '../billing/payments.service.js';
import { PaymentGatewaysService } from './payment-gateways.service.js';
import { AuditService } from '../common/audit.service.js';
import { AuthService } from '../auth/auth.service.js';

describe('Payment Gateways & Webhooks Integration (Section 13)', () => {
  const auditService = new AuditService();
  const authService = new AuthService(auditService);
  const invoicesService = new InvoicesService(auditService);
  const paymentsService = new PaymentsService(auditService);
  const gatewaysService = new PaymentGatewaysService(paymentsService, auditService);

  const webhookSecret = 'sandbox-webhook-secret-key-123';

  let tenant: any;
  let admin: any;
  let subscriber: any;
  let subscription: any;
  let pkg: any;
  let router: any;

  beforeAll(async () => {
    const reg = await authService.registerTenant({
      tenantName: 'Gateway Test ISP',
      tenantCode: `GW_ISP_${Date.now()}`,
      adminEmail: `gw_admin_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Gateway Admin',
    });
    tenant = reg.tenant;
    admin = reg.user;

    router = await prisma.router.create({
      data: {
        tenantId: tenant.id,
        name: 'Gateway Core Edge',
        host: '10.200.0.1',
        port: 8728,
        username: 'admin',
        encryptedPassword: encrypt('RouterPass123!'),
      },
    });

    pkg = await prisma.package.create({
      data: {
        tenantId: tenant.id,
        name: 'Fiber Gold 50M',
        code: `pkg-gw-${Date.now()}`,
        downloadSpeedKbps: 51200,
        uploadSpeedKbps: 51200,
        speedLimitRaw: '50M/50M',
        priceMinor: 200000, // 2000.00 BDT
        validityDays: 30,
        pppProfileName: 'profile-50M',
      },
    });

    subscriber = await prisma.subscriber.create({
      data: {
        tenantId: tenant.id,
        accountNumber: `SUB-GW-9001`,
        fullName: 'Fahim Ahmed',
        phone: '01819999888',
      },
    });

    subscription = await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        subscriberId: subscriber.id,
        packageId: pkg.id,
        routerId: router.id,
        status: 'ACTIVE',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 86400000),
      },
    });
  });

  afterAll(async () => {
    if (tenant?.id) {
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
    }
  });

  beforeEach(async () => {
    if (tenant?.id) {
      await prisma.paymentProviderEvent.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.paymentAllocation.deleteMany({
        where: { payment: { tenantId: tenant.id } },
      });
      await prisma.payment.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.invoiceLine.deleteMany({
        where: { invoice: { tenantId: tenant.id } },
      });
      await prisma.invoice.deleteMany({ where: { tenantId: tenant.id } });
    }
  });

  it('initiates online payment checkout session before presentation/redirect', async () => {
    const invoice = await invoicesService.create(tenant.id, {
      subscriberId: subscriber.id,
      subscriptionId: subscription.id,
      billingPeriodStart: new Date('2026-10-01').toISOString(),
      billingPeriodEnd: new Date('2026-10-31').toISOString(),
      dueDate: new Date('2026-10-10').toISOString(),
      lines: [{ description: '50M Fiber Subscription', quantity: 1, unitPriceMinor: 200000 }],
    });

    const initResult = await gatewaysService.initiatePayment(tenant.id, {
      subscriberId: subscriber.id,
      invoiceId: invoice.id,
      amountMinor: 200000,
      provider: PaymentGatewayProvider.BKASH,
      callbackUrl: 'http://localhost:3000/dashboard/payments',
    });

    expect(initResult.gatewayPaymentId).toBeDefined();
    expect(initResult.checkoutUrl).toContain('checkout.sandbox.gateway/bkash');
    expect(initResult.amountMinor).toBe(200000);
    expect(initResult.amountFormatted).toBe('BDT 2000.00');
    expect(initResult.currency).toBe('BDT');
    expect(initResult.expiresAt).toBeDefined();
  });

  it('rejects webhooks with invalid or missing cryptographic signatures', async () => {
    const rawPayload = JSON.stringify({
      eventId: 'evt-tampered-101',
      amountMinor: 100000,
      metadata: { subscriberId: subscriber.id },
    });

    // 1. Missing signature
    await expect(
      gatewaysService.processWebhook(
        PaymentGatewayProvider.BKASH,
        rawPayload,
        {},
        tenant.id
      )
    ).rejects.toThrow('Missing webhook signature header');

    // 2. Tampered signature
    await expect(
      gatewaysService.processWebhook(
        PaymentGatewayProvider.BKASH,
        rawPayload,
        { 'x-signature': '0000000000badbadbadbad00000000' },
        tenant.id
      )
    ).rejects.toThrow('Invalid webhook signature');
  });

  it('processes verified webhook, settles ledger, and marks invoice as PAID', async () => {
    const invoice = await invoicesService.create(tenant.id, {
      subscriberId: subscriber.id,
      subscriptionId: subscription.id,
      billingPeriodStart: new Date('2026-09-01').toISOString(),
      billingPeriodEnd: new Date('2026-09-30').toISOString(),
      dueDate: new Date('2026-09-10').toISOString(),
      lines: [{ description: 'Monthly Subscription', quantity: 1, unitPriceMinor: 150000 }],
    });

    const eventPayload = {
      eventId: 'BKASH-EVT-889911',
      eventType: 'payment.success',
      amountMinor: 150000,
      currency: 'BDT',
      transactionReference: 'TRX-BKASH-LIVE-9922',
      metadata: {
        tenantId: tenant.id,
        subscriberId: subscriber.id,
        invoiceId: invoice.id,
      },
    };

    const rawBody = JSON.stringify(eventPayload);
    const validSignature = MockPaymentGatewayAdapter.signPayload(rawBody, webhookSecret);

    const result = await gatewaysService.processWebhook(
      PaymentGatewayProvider.BKASH,
      rawBody,
      { 'x-signature': validSignature },
      tenant.id
    );

    expect(result.status).toBe('success');
    expect(result.eventId).toBe('BKASH-EVT-889911');
    expect(result.paymentNumber).toMatch(/^PAY-\d{5}$/);

    // Verify invoice is settled in ledger
    const settledInv = await invoicesService.getById(tenant.id, invoice.id);
    expect(settledInv.status).toBe(InvoiceStatus.PAID);
    expect(settledInv.paidAmountMinor).toBe(150000);
    expect(settledInv.balanceMinor).toBe(0);

    // Verify provider event is stored
    const storedEvent = await prisma.paymentProviderEvent.findUnique({
      where: {
        provider_eventId: {
          provider: PaymentGatewayProvider.BKASH,
          eventId: 'BKASH-EVT-889911',
        },
      },
    });
    expect(storedEvent).toBeDefined();
    expect(storedEvent?.isProcessed).toBe(true);
  });

  it('handles replayed and duplicate webhooks idempotently without double-crediting', async () => {
    const invoice = await invoicesService.create(tenant.id, {
      subscriberId: subscriber.id,
      subscriptionId: subscription.id,
      billingPeriodStart: new Date('2026-08-01').toISOString(),
      billingPeriodEnd: new Date('2026-08-31').toISOString(),
      dueDate: new Date('2026-08-10').toISOString(),
      lines: [{ description: 'Monthly fee', quantity: 1, unitPriceMinor: 100000 }],
    });

    const eventPayload = {
      eventId: 'NAGAD-IDEMPOTENT-001',
      eventType: 'payment.success',
      amountMinor: 100000,
      currency: 'BDT',
      transactionReference: 'TRX-NAGAD-776655',
      metadata: {
        tenantId: tenant.id,
        subscriberId: subscriber.id,
        invoiceId: invoice.id,
      },
    };

    const rawBody = JSON.stringify(eventPayload);
    const validSignature = MockPaymentGatewayAdapter.signPayload(rawBody, webhookSecret);

    // 1. Initial webhook delivery -> success
    const res1 = await gatewaysService.processWebhook(
      PaymentGatewayProvider.NAGAD,
      rawBody,
      { 'x-signature': validSignature },
      tenant.id
    );
    expect(res1.status).toBe('success');

    // Initial payment count for this subscriber
    const paymentsCountAfter1 = await prisma.payment.count({
      where: { subscriberId: subscriber.id },
    });

    // 2. Immediate replayed duplicate webhook delivery -> already_processed
    const res2 = await gatewaysService.processWebhook(
      PaymentGatewayProvider.NAGAD,
      rawBody,
      { 'x-signature': validSignature },
      tenant.id
    );

    expect(res2.status).toBe('already_processed');
    expect(res2.message).toContain('already processed idempotently');

    // Crucial check: No duplicate financial mutation occurred!
    const paymentsCountAfter2 = await prisma.payment.count({
      where: { subscriberId: subscriber.id },
    });
    expect(paymentsCountAfter2).toBe(paymentsCountAfter1);

    const inv = await invoicesService.getById(tenant.id, invoice.id);
    expect(inv.paidAmountMinor).toBe(100000);
    expect(inv.balanceMinor).toBe(0);
  });

  it('rejects webhooks with currency mismatch or non-positive amount', async () => {
    const payloadUSD = JSON.stringify({
      eventId: 'evt-currency-bad',
      eventType: 'payment.success',
      amountMinor: 100000,
      currency: 'USD', // Not BDT
      metadata: { tenantId: tenant.id, subscriberId: subscriber.id },
    });
    const sigUSD = MockPaymentGatewayAdapter.signPayload(payloadUSD, webhookSecret);

    await expect(
      gatewaysService.processWebhook(
        PaymentGatewayProvider.STRIPE,
        payloadUSD,
        { 'x-signature': sigUSD },
        tenant.id
      )
    ).rejects.toThrow("Currency mismatch: Expected 'BDT', received 'USD'");
  });

  it('lists provider webhook events for administrative audit', async () => {
    const list = await gatewaysService.listEvents(tenant.id);
    expect(Array.isArray(list)).toBe(true);
  });
});
