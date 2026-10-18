import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@mikrotik-billing/database';
import {
  SubscriptionStatus,
  InvoiceStatus,
  encrypt,
  MockSmsAdapter,
} from '@mikrotik-billing/shared';
import { RouterAdapterFactory } from '../routers/router-adapter.factory.js';
import { PppoeProvisioningService } from '../subscribers/pppoe-provisioning.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ServiceLifecycleService } from './service-lifecycle.service.js';
import { InvoicesService } from '../billing/invoices.service.js';
import { PaymentsService } from '../billing/payments.service.js';
import { AuditService } from '../common/audit.service.js';
import { AuthService } from '../auth/auth.service.js';

describe('Automated Service Lifecycle & Suspension Automation (Section 15)', () => {
  const auditService = new AuditService();
  const authService = new AuthService(auditService);
  const adapterFactory = new RouterAdapterFactory();
  const provisioningService = new PppoeProvisioningService(adapterFactory);
  const notificationsService = new NotificationsService(auditService);
  const mockSms = new MockSmsAdapter();
  notificationsService.setSmsAdapter(mockSms);

  const invoicesService = new InvoicesService(auditService);
  const paymentsService = new PaymentsService(auditService);
  const lifecycleService = new ServiceLifecycleService(
    provisioningService,
    notificationsService,
    auditService
  );

  let tenant: any;
  let admin: any;
  let router: any;
  let pkg: any;
  let subscriber: any;
  let subscription: any;

  beforeAll(async () => {
    const reg = await authService.registerTenant({
      tenantName: 'Lifecycle Test ISP',
      tenantCode: `LC_ISP_${Date.now()}`,
      adminEmail: `lc_admin_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Lifecycle Admin',
    });
    tenant = reg.tenant;
    admin = reg.user;

    router = await prisma.router.create({
      data: {
        tenantId: tenant.id,
        name: 'Edge Router LC-1',
        host: '10.250.0.1',
        port: 8728,
        username: 'admin',
        encryptedPassword: encrypt('SecurePass123!'),
      },
    });

    pkg = await prisma.package.create({
      data: {
        tenantId: tenant.id,
        name: 'Home Speed 20M',
        code: `pkg-lc-${Date.now()}`,
        downloadSpeedKbps: 20480,
        uploadSpeedKbps: 20480,
        speedLimitRaw: '20M/20M',
        priceMinor: 100000, // 1000.00 BDT
        validityDays: 30,
        pppProfileName: 'profile-20M',
      },
    });

    subscriber = await prisma.subscriber.create({
      data: {
        tenantId: tenant.id,
        accountNumber: `SUB-LC-001`,
        fullName: 'Zubair Hossain',
        phone: '01719000111',
      },
    });

    await prisma.pppoeAccount.create({
      data: {
        tenantId: tenant.id,
        subscriberId: subscriber.id,
        routerId: router.id,
        username: `zubair_lc_${Date.now()}`,
        encryptedPassword: encrypt('ClientPass123!'),
        pppProfile: 'profile-20M',
      },
    });

    subscription = await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        subscriberId: subscriber.id,
        packageId: pkg.id,
        routerId: router.id,
        status: SubscriptionStatus.ACTIVE,
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
    mockSms.clearHistory();
    if (tenant?.id) {
      await prisma.paymentAllocation.deleteMany({
        where: { payment: { tenantId: tenant.id } },
      });
      await prisma.payment.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.invoiceLine.deleteMany({
        where: { invoice: { tenantId: tenant.id } },
      });
      await prisma.invoice.deleteMany({ where: { tenantId: tenant.id } });
      await prisma.notificationJob.deleteMany({ where: { tenantId: tenant.id } });

      // Reset subscription to ACTIVE
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.ACTIVE },
      });
    }
  });

  it('dry-run mode forecasts suspensions and reminders without committing mutations', async () => {
    // Create an invoice overdue by 10 days
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000);
    await invoicesService.create(tenant.id, {
      subscriberId: subscriber.id,
      subscriptionId: subscription.id,
      billingPeriodStart: new Date(Date.now() - 40 * 86400000).toISOString(),
      billingPeriodEnd: new Date(Date.now() - 10 * 86400000).toISOString(),
      dueDate: tenDaysAgo.toISOString(),
      lines: [{ description: 'Internet Fee', quantity: 1, unitPriceMinor: 100000 }],
    });

    // Run in dry-run mode with 3 days grace period
    const dryRun = await lifecycleService.executeCycle(tenant.id, {
      isDryRun: true,
      gracePeriodDays: 3,
    });

    expect(dryRun.isDryRun).toBe(true);
    expect(dryRun.subscriptionsSuspended).toBe(1);
    expect(dryRun.actions.some((a) => a.action === 'SUSPEND')).toBe(true);

    // Crucial check: Subscription in database remains ACTIVE!
    const sub = await prisma.subscription.findUnique({ where: { id: subscription.id } });
    expect(sub?.status).toBe(SubscriptionStatus.ACTIVE);

    // No SMS was dispatched
    expect(mockSms.sentMessages.length).toBe(0);
  });

  it('respects grace period: does not suspend within grace days, suspends after cutoff', async () => {
    // 1. Invoice due 1 day ago (within 3 days grace period)
    const yesterday = new Date(Date.now() - 1 * 86400000);
    const inv1 = await invoicesService.create(tenant.id, {
      subscriberId: subscriber.id,
      subscriptionId: subscription.id,
      billingPeriodStart: new Date(Date.now() - 31 * 86400000).toISOString(),
      billingPeriodEnd: yesterday.toISOString(),
      dueDate: yesterday.toISOString(),
      lines: [{ description: 'Internet Fee', quantity: 1, unitPriceMinor: 100000 }],
    });

    const cycle1 = await lifecycleService.executeCycle(tenant.id, {
      isDryRun: false,
      gracePeriodDays: 3,
    });

    // Within grace -> 0 suspensions
    expect(cycle1.subscriptionsSuspended).toBe(0);
    const sub1 = await prisma.subscription.findUnique({ where: { id: subscription.id } });
    expect(sub1?.status).toBe(SubscriptionStatus.ACTIVE);

    // 2. Now simulate time passing: invoice becomes overdue by 5 days (beyond 3 days grace)
    await prisma.invoice.update({
      where: { id: inv1.id },
      data: { dueDate: new Date(Date.now() - 5 * 86400000) },
    });

    const cycle2 = await lifecycleService.executeCycle(tenant.id, {
      isDryRun: false,
      gracePeriodDays: 3,
    }, admin.id);

    expect(cycle2.subscriptionsSuspended).toBe(1);

    // Subscription status updated to SUSPENDED in DB
    const sub2 = await prisma.subscription.findUnique({ where: { id: subscription.id } });
    expect(sub2?.status).toBe(SubscriptionStatus.SUSPENDED);

    // Invoice marked OVERDUE
    const updatedInv = await prisma.invoice.findUnique({ where: { id: inv1.id } });
    expect(updatedInv?.status).toBe(InvoiceStatus.OVERDUE);

    // Service suspended notification sent
    expect(mockSms.sentMessages.some((m) => m.to.includes(subscriber.phone.slice(-8)))).toBe(true);
  });

  it('never suspends when invoice balance is zero or paid', async () => {
    // Create an old invoice but immediately pay it in full
    const inv = await invoicesService.create(tenant.id, {
      subscriberId: subscriber.id,
      subscriptionId: subscription.id,
      billingPeriodStart: new Date(Date.now() - 45 * 86400000).toISOString(),
      billingPeriodEnd: new Date(Date.now() - 15 * 86400000).toISOString(),
      dueDate: new Date(Date.now() - 10 * 86400000).toISOString(),
      lines: [{ description: 'Internet Fee', quantity: 1, unitPriceMinor: 100000 }],
    });

    await paymentsService.recordPayment(tenant.id, {
      subscriberId: subscriber.id,
      invoiceId: inv.id,
      amountMinor: 100000,
      method: 'CASH' as any,
    });

    // Execute lifecycle run
    const result = await lifecycleService.executeCycle(tenant.id, {
      isDryRun: false,
      gracePeriodDays: 3,
    });

    expect(result.subscriptionsSuspended).toBe(0);
    const sub = await prisma.subscription.findUnique({ where: { id: subscription.id } });
    expect(sub?.status).toBe(SubscriptionStatus.ACTIVE);
  });

  it('automatically restores suspended subscription once overdue invoices are settled', async () => {
    // 1. Set subscription to SUSPENDED with overdue invoice
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: SubscriptionStatus.SUSPENDED },
    });

    const inv = await invoicesService.create(tenant.id, {
      subscriberId: subscriber.id,
      subscriptionId: subscription.id,
      billingPeriodStart: new Date(Date.now() - 40 * 86400000).toISOString(),
      billingPeriodEnd: new Date(Date.now() - 10 * 86400000).toISOString(),
      dueDate: new Date(Date.now() - 6 * 86400000).toISOString(),
      lines: [{ description: 'Overdue Subscription', quantity: 1, unitPriceMinor: 100000 }],
    });

    // 2. Client pays overdue invoice
    await paymentsService.recordPayment(tenant.id, {
      subscriberId: subscriber.id,
      invoiceId: inv.id,
      amountMinor: 100000,
      method: 'BKASH' as any,
      externalReference: 'TRX-RESTORE-101',
    });

    // 3. Automated lifecycle cycle detects settled balance and restores service
    const cycle = await lifecycleService.executeCycle(tenant.id, {
      isDryRun: false,
    }, admin.id);

    expect(cycle.subscriptionsRestored).toBe(1);

    const sub = await prisma.subscription.findUnique({ where: { id: subscription.id } });
    expect(sub?.status).toBe(SubscriptionStatus.ACTIVE);

    // Service restored SMS sent
    expect(mockSms.sentMessages.some((m) => m.to.includes(subscriber.phone.slice(-8)))).toBe(true);
  });

  it('supports audited manual override by administrators', async () => {
    const res = await lifecycleService.manualOverride(
      tenant.id,
      {
        subscriptionId: subscription.id,
        action: 'EXTEND_GRACE',
        reason: 'Customer requested 5 days extension due to bank holiday',
        graceDays: 5,
      },
      admin.id
    );

    expect(res.success).toBe(true);
    expect(res.message).toContain('extended by 5 days');

    // Audit log was recorded
    const audit = await prisma.auditLog.findFirst({
      where: {
        tenantId: tenant.id,
        entityId: subscription.id,
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(audit).toBeDefined();
    expect(audit?.details).toMatchObject({ extensionDays: 5 });
  });

  it('reconciles service states and detects discrepancies accurately', async () => {
    const report = await lifecycleService.reconcileServiceStates(tenant.id);
    expect(report.totalSubscriptions).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(report.discrepancies)).toBe(true);
  });
});
