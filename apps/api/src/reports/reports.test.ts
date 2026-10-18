import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@mikrotik-billing/database';
import {
  AuditAction,
  PaymentMethod,
  PaymentStatus,
  InvoiceStatus,
  SubscriptionStatus,
} from '@mikrotik-billing/shared';
import { ReportsService } from './reports.service';
import { AuditService } from '../common/audit.service';
import { AuthService } from '../auth/auth.service';

describe('Dashboard, Reports, and Audit Trail (Section 16)', () => {
  const auditService = new AuditService();
  const authService = new AuthService(auditService);
  const reportsService = new ReportsService();

  let tenantA: any;
  let tenantB: any;
  let adminA: any;
  let routerA: any;
  let pkgA: any;
  let subscriberA: any;
  let subscriberB: any;

  beforeAll(async () => {
    // 1. Register Tenant A
    const regA = await authService.registerTenant({
      tenantName: 'Reports ISP Alpha',
      tenantCode: `RPT_A_${Date.now()}`,
      adminEmail: `rpt_admin_a_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Report Admin Alpha',
    });
    tenantA = regA.tenant;
    adminA = regA.user;

    // 2. Register Tenant B for cross-tenant isolation testing
    const regB = await authService.registerTenant({
      tenantName: 'Reports ISP Beta',
      tenantCode: `RPT_B_${Date.now()}`,
      adminEmail: `rpt_admin_b_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Report Admin Beta',
    });
    tenantB = regB.tenant;

    // 3. Create Router for Tenant A
    routerA = await prisma.router.create({
      data: {
        tenantId: tenantA.id,
        name: 'Alpha-CCR2004',
        host: '10.0.0.1',
        port: 8728,
        protocol: 'REST_HTTPS',
        username: 'admin',
        encryptedPassword: 'enc',
        connectionStatus: 'ONLINE',
        cpuLoad: 24,
        memoryFree: BigInt(512000000),
        uptime: '12d 04:00:00',
        rosVersion: '7.14.3',
        lastSeenAt: new Date(),
      },
    });

    // 4. Create Package for Tenant A
    pkgA = await prisma.package.create({
      data: {
        tenantId: tenantA.id,
        name: 'Standard 20M',
        code: `PKG_20M_${Date.now()}`,
        downloadSpeedKbps: 20480,
        uploadSpeedKbps: 20480,
        priceMinor: 150000,
        billingCycle: 'MONTHLY',
        validityDays: 30,
      },
    });

    // 5. Create Subscribers for Tenant A
    subscriberA = await prisma.subscriber.create({
      data: {
        tenantId: tenantA.id,
        fullName: 'Kamal Hossain',
        phone: '+8801711000111',
        accountNumber: `ACC-A-${Date.now()}`,
      },
    });

    await prisma.subscription.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: subscriberA.id,
        packageId: pkgA.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 86400000),
      },
    });

    await prisma.pppoeAccount.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: subscriberA.id,
        routerId: routerA.id,
        username: `kamal_${Date.now()}`,
        encryptedPassword: 'enc',
        isSuspended: false,
      },
    });

    // 6. Create Subscriber for Tenant B
    subscriberB = await prisma.subscriber.create({
      data: {
        tenantId: tenantB.id,
        fullName: 'Secret Beta Client',
        phone: '+8801911999888',
        accountNumber: `ACC-B-${Date.now()}`,
      },
    });

    // 7. Seed Invoices for Aging Report (Current, 15 days overdue, 45 days overdue)
    const now = Date.now();
    // Invoice 1: Current (due in 5 days)
    await prisma.invoice.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: subscriberA.id,
        subscriptionId: (await prisma.subscription.findFirst({ where: { subscriberId: subscriberA.id } }))!.id,
        invoiceNumber: `INV-CUR-${Date.now()}`,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(now + 30 * 86400000),
        dueDate: new Date(now + 5 * 86400000),
        subtotalMinor: 150000,
        totalMinor: 150000,
        balanceMinor: 150000,
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
      },
    });

    // Invoice 2: 15 days overdue
    await prisma.invoice.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: subscriberA.id,
        subscriptionId: (await prisma.subscription.findFirst({ where: { subscriberId: subscriberA.id } }))!.id,
        invoiceNumber: `INV-OD15-${Date.now()}`,
        billingPeriodStart: new Date(now - 45 * 86400000),
        billingPeriodEnd: new Date(now - 15 * 86400000),
        dueDate: new Date(now - 15 * 86400000),
        subtotalMinor: 200000,
        totalMinor: 200000,
        balanceMinor: 200000,
        status: InvoiceStatus.OVERDUE,
        issuedAt: new Date(now - 45 * 86400000),
      },
    });

    // Invoice 3: 45 days overdue
    await prisma.invoice.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: subscriberA.id,
        subscriptionId: (await prisma.subscription.findFirst({ where: { subscriberId: subscriberA.id } }))!.id,
        invoiceNumber: `INV-OD45-${Date.now()}`,
        billingPeriodStart: new Date(now - 75 * 86400000),
        billingPeriodEnd: new Date(now - 45 * 86400000),
        dueDate: new Date(now - 45 * 86400000),
        subtotalMinor: 100000,
        totalMinor: 100000,
        balanceMinor: 100000,
        status: InvoiceStatus.OVERDUE,
        issuedAt: new Date(now - 75 * 86400000),
      },
    });

    // 8. Seed Payments for Collections Report (bKash confirmed + Cash confirmed + 1 Reversed)
    await prisma.payment.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: subscriberA.id,
        paymentNumber: `PAY-BK-${Date.now()}`,
        amountMinor: 150000,
        method: PaymentMethod.BKASH,
        status: PaymentStatus.CONFIRMED,
        collectedBy: adminA.fullName,
        createdAt: new Date(),
      },
    });

    await prisma.payment.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: subscriberA.id,
        paymentNumber: `PAY-CSH-${Date.now()}`,
        amountMinor: 50000,
        method: PaymentMethod.CASH,
        status: PaymentStatus.CONFIRMED,
        collectedBy: 'Walk-in Cashier',
        createdAt: new Date(),
      },
    });

    await prisma.payment.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: subscriberA.id,
        paymentNumber: `PAY-REV-${Date.now()}`,
        amountMinor: 30000,
        method: PaymentMethod.CASH,
        status: PaymentStatus.REVERSED,
        collectedBy: 'Walk-in Cashier',
        createdAt: new Date(),
      },
    });

    // 9. Seed Audit Logs
    await auditService.log({
      tenantId: tenantA.id,
      userId: adminA.id,
      action: AuditAction.SUBSCRIBER_CREATED,
      entityType: 'Subscriber',
      entityId: subscriberA.id,
      details: { name: subscriberA.fullName },
    });

    await auditService.log({
      tenantId: tenantA.id,
      userId: adminA.id,
      action: AuditAction.PAYMENT_RECORDED,
      entityType: 'Payment',
      entityId: `PAY-BK-${Date.now()}`,
      details: { amount: 1500 },
    });

    await auditService.log({
      tenantId: tenantB.id,
      action: AuditAction.CONFIG_CHANGED,
      entityType: 'Tenant',
      entityId: tenantB.id,
      details: { note: 'Secret Beta Config' },
    });
  });

  afterAll(async () => {
    if (tenantA) {
      await prisma.tenant.delete({ where: { id: tenantA.id } }).catch(() => {});
    }
    if (tenantB) {
      await prisma.tenant.delete({ where: { id: tenantB.id } }).catch(() => {});
    }
  });

  it('1. calculates dashboard overview metrics and caches consecutive requests', async () => {
    const overview1 = await reportsService.getDashboardOverview(tenantA.id);

    expect(overview1.metrics.totalSubscribers).toBeGreaterThanOrEqual(1);
    expect(overview1.metrics.activeSubscribers).toBeGreaterThanOrEqual(1);
    expect(overview1.metrics.totalRouters).toBe(1);
    expect(overview1.metrics.onlineRouters).toBe(1);
    expect(overview1.metrics.outstandingDueMinor).toBeGreaterThanOrEqual(450000);
    expect(overview1.metrics.overdueInvoicesCount).toBe(2);
    expect(overview1.dataFreshness.isCached).toBe(false);
    expect(overview1.recentActivity.length).toBeGreaterThan(0);

    // Immediate second call should hit the short-lived in-memory cache
    const overview2 = await reportsService.getDashboardOverview(tenantA.id);
    expect(overview2.dataFreshness.isCached).toBe(true);
    expect(overview2.metrics.totalSubscribers).toBe(overview1.metrics.totalSubscribers);
  });

  it('2. generates collections report with gross, reversals, net, and cashier breakdown', async () => {
    const report = await reportsService.getCollectionsReport(tenantA.id);

    // Gross: 150000 + 50000 = 200000
    // Reversal: 30000
    // Net: 170000
    expect(report.grossCollectedMinor).toBe(200000);
    expect(report.reversalsMinor).toBe(30000);
    expect(report.netCollectedMinor).toBe(170000);
    expect(report.totalTransactionsCount).toBe(3);

    // Method breakdown
    expect(report.byMethod['BKASH'].totalMinor).toBe(150000);
    expect(report.byMethod['CASH'].totalMinor).toBe(50000);

    // Cashier breakdown
    expect(report.byCashier.length).toBeGreaterThanOrEqual(2);
    const cashierEntry = report.byCashier.find((c) => c.cashierName === 'Walk-in Cashier');
    expect(cashierEntry).toBeDefined();
    expect(cashierEntry?.totalMinor).toBe(50000);
  });

  it('3. generates aging report with current and overdue aging buckets', async () => {
    const aging = await reportsService.getAgingReport(tenantA.id);

    expect(aging.totalOutstandingMinor).toBe(450000);
    expect(aging.totalOverdueCount).toBe(2);

    // Current bucket (not overdue)
    expect(aging.buckets.current.count).toBe(1);
    expect(aging.buckets.current.totalMinor).toBe(150000);

    // 1-30 days overdue bucket (15 days overdue invoice)
    expect(aging.buckets.days1to30.count).toBe(1);
    expect(aging.buckets.days1to30.totalMinor).toBe(200000);

    // 31-60 days overdue bucket (45 days overdue invoice)
    expect(aging.buckets.days31to60.count).toBe(1);
    expect(aging.buckets.days31to60.totalMinor).toBe(100000);

    // Top debtors list
    expect(aging.topDebtors.length).toBe(1);
    expect(aging.topDebtors[0].subscriberId).toBe(subscriberA.id);
    expect(aging.topDebtors[0].balanceMinor).toBe(450000);
    expect(aging.topDebtors[0].invoiceCount).toBe(3);
    expect(aging.topDebtors[0].daysOverdue).toBeGreaterThanOrEqual(44);
  });

  it('4. generates subscriber growth and package/router distribution report', async () => {
    const growth = await reportsService.getSubscriberGrowthReport(tenantA.id);

    expect(growth.totalCount).toBe(1);
    expect(growth.activeCount).toBe(1);
    expect(growth.suspendedCount).toBe(0);

    // Package breakdown
    const pkgItem = growth.byPackage.find((p) => p.packageId === pkgA.id);
    expect(pkgItem).toBeDefined();
    expect(pkgItem?.count).toBe(1);

    // Router breakdown
    const routerItem = growth.byRouter.find((r) => r.routerId === routerA.id);
    expect(routerItem).toBeDefined();
    expect(routerItem?.count).toBe(1);
  });

  it('5. provides router health metrics without synchronous hardware polling', async () => {
    const health = await reportsService.getRouterHealthReport(tenantA.id);

    expect(health.totalRouters).toBe(1);
    expect(health.onlineCount).toBe(1);
    expect(health.offlineCount).toBe(0);
    expect(health.avgCpuLoad).toBe(24);
    expect(health.totalSessions).toBe(1);
    expect(health.routers[0].isStale).toBe(false);
    expect(health.generatedAt).toBeDefined();
  });

  it('6. provides paginated audit log browsing and enforces strict tenant isolation', async () => {
    // Query Tenant A's audit logs
    const logsA = await reportsService.getAuditLogs(tenantA.id, {
      limit: 10,
    });

    expect(logsA.total).toBe(2);
    expect(logsA.items.length).toBe(2);
    // Every log returned must strictly belong to Tenant A
    expect(logsA.items.some((l) => l.action === AuditAction.SUBSCRIBER_CREATED)).toBe(true);
    expect(logsA.items.some((l) => l.action === AuditAction.PAYMENT_RECORDED)).toBe(true);

    // Verify Tenant A CANNOT see Tenant B's CONFIG_CHANGED audit log
    expect(logsA.items.some((l) => l.action === AuditAction.CONFIG_CHANGED)).toBe(false);

    // Query Tenant B's audit logs
    const logsB = await reportsService.getAuditLogs(tenantB.id, {
      limit: 10,
    });
    expect(logsB.total).toBe(1);
    expect(logsB.items[0].action).toBe(AuditAction.CONFIG_CHANGED);

    // Verify filtering by action
    const filteredByAction = await reportsService.getAuditLogs(tenantA.id, {
      action: AuditAction.PAYMENT_RECORDED,
    });
    expect(filteredByAction.total).toBe(1);
    expect(filteredByAction.items[0].entityType).toBe('Payment');
  });
});
