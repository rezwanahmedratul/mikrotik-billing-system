import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@mikrotik-billing/database';
import {
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
  encrypt,
} from '@mikrotik-billing/shared';
import { InvoicesService } from './invoices.service.js';
import { PaymentsService } from './payments.service.js';
import { BillingRunsService } from './billing-runs.service.js';
import { AuditService } from '../common/audit.service.js';
import { AuthService } from '../auth/auth.service.js';

describe('Invoice and Billing Ledger Service', () => {
  const auditService = new AuditService();
  const authService = new AuthService(auditService);
  const invoicesService = new InvoicesService(auditService);
  const paymentsService = new PaymentsService(auditService);
  const billingRunsService = new BillingRunsService(auditService, invoicesService);

  let tenantA: any;
  let tenantB: any;
  let adminA: any;
  let cashierA: any;
  let subscriberA: any;
  let subscriptionA: any;
  let packageA: any;
  let routerA: any;

  beforeAll(async () => {
    const regA = await authService.registerTenant({
      tenantName: 'Billing Test ISP A',
      tenantCode: `BILL_A_${Date.now()}`,
      adminEmail: `bill_admin_a_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Alice Accountant',
    });
    tenantA = regA.tenant;
    adminA = regA.user;

    cashierA = await prisma.user.create({
      data: {
        email: `cashier_${Date.now()}@example.com`,
        passwordHash: 'dummy',
        fullName: 'Kamal Cashier',
        memberships: {
          create: {
            tenantId: tenantA.id,
            role: 'CASHIER',
          },
        },
      },
    });

    const regB = await authService.registerTenant({
      tenantName: 'Billing Test ISP B',
      tenantCode: `BILL_B_${Date.now()}`,
      adminEmail: `bill_admin_b_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Bob Accountant',
    });
    tenantB = regB.tenant;

    routerA = await prisma.router.create({
      data: {
        tenantId: tenantA.id,
        name: 'Gulshan Edge Router',
        host: '10.0.0.1',
        port: 8728,
        username: 'admin',
        encryptedPassword: encrypt('SecurePass123!'),
      },
    });

    packageA = await prisma.package.create({
      data: {
        tenantId: tenantA.id,
        name: 'Premium 25M',
        code: `pkg-prem-${Date.now()}`,
        downloadSpeedKbps: 25600,
        uploadSpeedKbps: 25600,
        speedLimitRaw: '25M/25M',
        priceMinor: 150000, // 1500 BDT
        validityDays: 30,
        pppProfileName: 'profile-25M',
      },
    });

    subscriberA = await prisma.subscriber.create({
      data: {
        tenantId: tenantA.id,
        accountNumber: `SUB-3001`,
        fullName: 'Mahmudur Rahman',
        phone: '01715000001',
      },
    });

    subscriptionA = await prisma.subscription.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: subscriberA.id,
        packageId: packageA.id,
        routerId: routerA.id,
        status: 'ACTIVE',
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 86400000),
      },
    });
  });

  afterAll(async () => {
    if (tenantA?.id) {
      await prisma.tenant.delete({ where: { id: tenantA.id } }).catch(() => {});
    }
    if (tenantB?.id) {
      await prisma.tenant.delete({ where: { id: tenantB.id } }).catch(() => {});
    }
  });

  beforeEach(async () => {
    if (tenantA?.id) {
      await prisma.paymentAllocation.deleteMany({
        where: { payment: { tenantId: tenantA.id } },
      });
      await prisma.payment.deleteMany({ where: { tenantId: tenantA.id } });
      await prisma.invoiceLine.deleteMany({
        where: { invoice: { tenantId: tenantA.id } },
      });
      await prisma.invoice.deleteMany({ where: { tenantId: tenantA.id } });
      await prisma.billingRun.deleteMany({ where: { tenantId: tenantA.id } });
    }
  });

  it('creates an invoice with line items, taxes, discounts, and minor unit amounts', async () => {
    const cycleStart = new Date('2026-11-01T00:00:00.000Z');
    const cycleEnd = new Date('2026-11-30T23:59:59.000Z');
    const dueDate = new Date('2026-11-10T00:00:00.000Z');

    const invoice = await invoicesService.create(
      tenantA.id,
      {
        subscriberId: subscriberA.id,
        subscriptionId: subscriptionA.id,
        billingPeriodStart: cycleStart.toISOString(),
        billingPeriodEnd: cycleEnd.toISOString(),
        dueDate: dueDate.toISOString(),
        lines: [
          {
            description: 'Fiber Internet 25M Monthly Subscription',
            quantity: 1,
            unitPriceMinor: 150000, // 1500.00 BDT
          },
          {
            description: 'Public Static IPv4 Rental',
            quantity: 1,
            unitPriceMinor: 20000, // 200.00 BDT
          },
        ],
        discountMinor: 10000, // 100.00 BDT discount
        taxMinor: 8000, // 80.00 BDT tax (5%)
        notes: 'November Monthly Statement',
      },
      adminA.id
    );

    expect(invoice.id).toBeDefined();
    expect(invoice.invoiceNumber).toMatch(/^INV-\d{5}$/);
    expect(invoice.subtotalMinor).toBe(170000); // 150000 + 20000
    expect(invoice.discountMinor).toBe(10000);
    expect(invoice.taxMinor).toBe(8000);
    expect(invoice.totalMinor).toBe(168000); // 170000 - 10000 + 8000
    expect(invoice.paidAmountMinor).toBe(0);
    expect(invoice.balanceMinor).toBe(168000);
    expect(invoice.status).toBe(InvoiceStatus.ISSUED);
    expect(invoice.totalFormatted).toBe('BDT 1680.00');
    expect(invoice.lines.length).toBe(2);
  });

  it('prevents duplicate invoice generation for the same subscription and period', async () => {
    const cycleStart = new Date('2026-12-01T00:00:00.000Z');
    const cycleEnd = new Date('2026-12-31T23:59:59.000Z');
    const dueDate = new Date('2026-12-10T00:00:00.000Z');

    await invoicesService.create(tenantA.id, {
      subscriberId: subscriberA.id,
      subscriptionId: subscriptionA.id,
      billingPeriodStart: cycleStart.toISOString(),
      billingPeriodEnd: cycleEnd.toISOString(),
      dueDate: dueDate.toISOString(),
      lines: [{ description: 'Monthly fee', quantity: 1, unitPriceMinor: 150000 }],
    });

    // Second creation for same period -> ConflictException
    await expect(
      invoicesService.create(tenantA.id, {
        subscriberId: subscriberA.id,
        subscriptionId: subscriptionA.id,
        billingPeriodStart: cycleStart.toISOString(),
        billingPeriodEnd: cycleEnd.toISOString(),
        dueDate: dueDate.toISOString(),
        lines: [{ description: 'Monthly fee duplicate', quantity: 1, unitPriceMinor: 150000 }],
      })
    ).rejects.toThrow('already exists for this subscription period');
  });

  it('records payment, executes partial and full allocations, and updates invoice status', async () => {
    const inv1 = await invoicesService.create(tenantA.id, {
      subscriberId: subscriberA.id,
      subscriptionId: subscriptionA.id,
      billingPeriodStart: new Date('2026-08-01').toISOString(),
      billingPeriodEnd: new Date('2026-08-31').toISOString(),
      dueDate: new Date('2026-08-10').toISOString(),
      lines: [{ description: 'August Bill', quantity: 1, unitPriceMinor: 100000 }], // 1000.00 BDT
    });

    const inv2 = await invoicesService.create(tenantA.id, {
      subscriberId: subscriberA.id,
      subscriptionId: subscriptionA.id,
      billingPeriodStart: new Date('2026-09-01').toISOString(),
      billingPeriodEnd: new Date('2026-09-30').toISOString(),
      dueDate: new Date('2026-09-10').toISOString(),
      lines: [{ description: 'September Bill', quantity: 1, unitPriceMinor: 100000 }], // 1000.00 BDT
    });

    // 1. Partial payment: Pay 1500 BDT (150000 minor)
    // Allocates 1000 BDT to inv1 (FIFO), remaining 500 BDT to inv2
    const payment = await paymentsService.recordPayment(
      tenantA.id,
      {
        subscriberId: subscriberA.id,
        amountMinor: 150000,
        method: PaymentMethod.BKASH,
        externalReference: 'TRX99887766',
        notes: 'bKash online merchant payment',
      },
      adminA.id
    );

    expect(payment.id).toBeDefined();
    expect(payment.paymentNumber).toMatch(/^PAY-\d{5}$/);
    expect(payment.allocations.length).toBe(2);

    // Check inv1 -> Fully paid
    const updatedInv1 = await invoicesService.getById(tenantA.id, inv1.id);
    expect(updatedInv1.paidAmountMinor).toBe(100000);
    expect(updatedInv1.balanceMinor).toBe(0);
    expect(updatedInv1.status).toBe(InvoiceStatus.PAID);
    expect(updatedInv1.paidAt).toBeDefined();

    // Check inv2 -> Partially paid
    const updatedInv2 = await invoicesService.getById(tenantA.id, inv2.id);
    expect(updatedInv2.paidAmountMinor).toBe(50000);
    expect(updatedInv2.balanceMinor).toBe(50000);
    expect(updatedInv2.status).toBe(InvoiceStatus.PARTIALLY_PAID);

    // 2. Settle remaining 500 BDT on inv2
    await paymentsService.recordPayment(tenantA.id, {
      subscriberId: subscriberA.id,
      invoiceId: inv2.id,
      amountMinor: 50000,
      method: PaymentMethod.CASH,
    });

    const settledInv2 = await invoicesService.getById(tenantA.id, inv2.id);
    expect(settledInv2.balanceMinor).toBe(0);
    expect(settledInv2.status).toBe(InvoiceStatus.PAID);
  });

  it('reverses payment and restores invoice balances', async () => {
    const inv = await invoicesService.create(tenantA.id, {
      subscriberId: subscriberA.id,
      subscriptionId: subscriptionA.id,
      billingPeriodStart: new Date('2026-07-01').toISOString(),
      billingPeriodEnd: new Date('2026-07-31').toISOString(),
      dueDate: new Date('2026-07-10').toISOString(),
      lines: [{ description: 'July Bill', quantity: 1, unitPriceMinor: 80000 }],
    });

    const payment = await paymentsService.recordPayment(tenantA.id, {
      subscriberId: subscriberA.id,
      invoiceId: inv.id,
      amountMinor: 80000,
      method: PaymentMethod.NAGAD,
    });

    expect((await invoicesService.getById(tenantA.id, inv.id)).status).toBe(InvoiceStatus.PAID);

    // Reverse payment
    const reversed = await paymentsService.reversePayment(
      tenantA.id,
      payment.id,
      'Chargeback / customer dispute',
      adminA.id
    );

    expect(reversed.status).toBe(PaymentStatus.REVERSED);

    // Invoice restored to ISSUED with full balance
    const restoredInv = await invoicesService.getById(tenantA.id, inv.id);
    expect(restoredInv.paidAmountMinor).toBe(0);
    expect(restoredInv.balanceMinor).toBe(80000);
    expect(restoredInv.status).toBe(InvoiceStatus.ISSUED);
  });

  it('executes idempotent batch billing runs with dry-run support', async () => {
    const cycleStart = '2026-10-01T00:00:00.000Z';
    const cycleEnd = '2026-10-31T23:59:59.000Z';

    // 1. Dry run
    const dryRun = await billingRunsService.executeBillingRun(
      tenantA.id,
      { isDryRun: true, cycleStart, cycleEnd },
      adminA.id
    );

    expect(dryRun.isDryRun).toBe(true);
    expect(dryRun.invoicesGenerated).toBe(1);
    expect(dryRun.totalBilledMinor).toBe(150000);

    // Verified no real invoice was created in dry run
    const preCount = await prisma.invoice.count({ where: { tenantId: tenantA.id } });
    expect(preCount).toBe(0);

    // 2. Live execution
    const liveRun = await billingRunsService.executeBillingRun(
      tenantA.id,
      { isDryRun: false, cycleStart, cycleEnd },
      adminA.id
    );

    expect(liveRun.isDryRun).toBe(false);
    expect(liveRun.invoicesGenerated).toBe(1);
    expect(liveRun.totalBilledMinor).toBe(150000);

    const postCount = await prisma.invoice.count({ where: { tenantId: tenantA.id } });
    expect(postCount).toBe(1);

    // 3. Repeat run for the same cycle (idempotency check)
    const repeatRun = await billingRunsService.executeBillingRun(
      tenantA.id,
      { isDryRun: false, cycleStart, cycleEnd },
      adminA.id
    );

    // Skips already-billed subscription!
    expect(repeatRun.invoicesGenerated).toBe(0);
    expect(repeatRun.totalBilledMinor).toBe(0);
  });

  it('rejects duplicate payment submission with identical external reference', async () => {
    await paymentsService.recordPayment(tenantA.id, {
      subscriberId: subscriberA.id,
      amountMinor: 50000,
      method: PaymentMethod.BKASH,
      externalReference: 'UNIQUE-TX-99001',
    });

    // Attempting same externalReference throws ConflictException
    await expect(
      paymentsService.recordPayment(tenantA.id, {
        subscriberId: subscriberA.id,
        amountMinor: 50000,
        method: PaymentMethod.BKASH,
        externalReference: 'UNIQUE-TX-99001',
      })
    ).rejects.toThrow('already exists');
  });

  it('generates accurate reconciliation reports with breakdown by method and collector', async () => {
    // Record payment 1 (Cashier via CASH)
    await paymentsService.recordPayment(
      tenantA.id,
      {
        subscriberId: subscriberA.id,
        amountMinor: 100000,
        method: PaymentMethod.CASH,
        notes: 'Cash counter collection',
      },
      cashierA.id
    );

    // Record payment 2 (Admin via BKASH)
    const p2 = await paymentsService.recordPayment(
      tenantA.id,
      {
        subscriberId: subscriberA.id,
        amountMinor: 50000,
        method: PaymentMethod.BKASH,
        notes: 'bKash merchant',
      },
      adminA.id
    );

    // Reverse payment 2
    await paymentsService.reversePayment(tenantA.id, p2.id, 'Wrong amount entered', adminA.id);

    const report = await paymentsService.getReconciliationReport(tenantA.id);

    expect(report.totalConfirmedMinor).toBe(100000);
    expect(report.totalReversedMinor).toBe(50000);
    expect(report.netCollectedMinor).toBe(50000);
    expect(report.paymentsCount).toBe(1);
    expect(report.reversedCount).toBe(1);
    expect(report.byMethod.some((m) => m.method === 'CASH' && m.totalMinor === 100000)).toBe(true);
    expect(report.byCollector.some((c) => c.collector === cashierA.id)).toBe(true);
  });
});
