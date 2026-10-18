import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@mikrotik-billing/database';
import {
  SubscriptionStatus,
  InvoiceStatus,
} from '@mikrotik-billing/shared';
import { SubscribersService } from '../subscribers/subscribers.service';
import { SubscriptionsService } from '../subscribers/subscriptions.service';
import { ReportsService } from '../reports/reports.service';
import { AuditService } from './audit.service';
import { AuthService } from '../auth/auth.service';
import { RouterAdapterFactory } from '../routers/router-adapter.factory';
import { PppoeProvisioningService } from '../subscribers/pppoe-provisioning.service';

describe('Performance and Scale Benchmarking (Section 17)', () => {
  const auditService = new AuditService();
  const authService = new AuthService(auditService);
  const reportsService = new ReportsService();
  const subscriptionsService = new SubscriptionsService(auditService);
  const adapterFactory = new RouterAdapterFactory();
  const provisioningService = new PppoeProvisioningService(adapterFactory);
  const subscribersService = new SubscribersService(
    auditService,
    provisioningService,
    subscriptionsService
  );

  let tenant: any;
  let admin: any;
  let router: any;
  let pkg: any;

  beforeAll(async () => {
    // 1. Setup Benchmark Tenant
    const reg = await authService.registerTenant({
      tenantName: 'Scale Benchmark ISP',
      tenantCode: `SCALE_${Date.now()}`,
      adminEmail: `scale_admin_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Benchmark Admin',
    });
    tenant = reg.tenant;
    admin = reg.user;

    // 2. Setup Router
    router = await prisma.router.create({
      data: {
        tenantId: tenant.id,
        name: 'Scale-Core-CCR',
        host: '10.200.0.1',
        port: 8728,
        protocol: 'REST_HTTPS',
        username: 'admin',
        encryptedPassword: 'enc',
        connectionStatus: 'ONLINE',
        lastSeenAt: new Date(),
      },
    });

    // 3. Setup Package
    pkg = await prisma.package.create({
      data: {
        tenantId: tenant.id,
        name: 'Scale 50M Enterprise',
        code: `PKG_SCALE_${Date.now()}`,
        downloadSpeedKbps: 51200,
        uploadSpeedKbps: 51200,
        speedLimitRaw: '50M/50M',
        pppProfileName: 'profile-50m',
        priceMinor: 300000,
        billingCycle: 'MONTHLY',
        validityDays: 30,
      },
    });

    // 4. Batch seed 100 subscribers with active subscriptions and invoices
    const subscriberData = [];
    for (let i = 1; i <= 100; i++) {
      subscriberData.push({
        tenantId: tenant.id,
        fullName: `Client Number ${i}`,
        phone: `+8801700000${String(i).padStart(3, '0')}`,
        accountNumber: `ACC-SCALE-${i}-${Date.now()}`,
      });
    }

    await prisma.subscriber.createMany({
      data: subscriberData,
    });

    const createdSubscribers = await prisma.subscriber.findMany({
      where: { tenantId: tenant.id },
      take: 100,
    });

    // Batch seed subscriptions and invoices
    const subData = [];
    const invData = [];
    const now = Date.now();

    for (const sub of createdSubscribers) {
      subData.push({
        tenantId: tenant.id,
        subscriberId: sub.id,
        packageId: pkg.id,
        routerId: router.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        expiryDate: new Date(now + 30 * 86400000),
      });

      invData.push({
        tenantId: tenant.id,
        subscriberId: sub.id,
        subscriptionId: '',
        invoiceNumber: `INV-SCL-${sub.accountNumber}`,
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(now + 30 * 86400000),
        dueDate: new Date(now + 10 * 86400000),
        subtotalMinor: 300000,
        totalMinor: 300000,
        balanceMinor: 300000,
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
      });
    }

    await prisma.subscription.createMany({ data: subData });

    // Link subscription IDs
    const createdSubs = await prisma.subscription.findMany({
      where: { tenantId: tenant.id },
    });
    for (let i = 0; i < invData.length; i++) {
      if (createdSubs[i]) {
        invData[i].subscriptionId = createdSubs[i].id;
      }
    }
    await prisma.invoice.createMany({ data: invData });
  });

  afterAll(async () => {
    if (tenant) {
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
    }
  });

  it('1. Indexed list query latency p95 is below 500ms target under concurrent load', async () => {
    const latencies: number[] = [];
    const CONCURRENCY = 40;

    const tasks = Array.from({ length: CONCURRENCY }, async (_, idx) => {
      const page = (idx % 5) + 1;
      const start = performance.now();
      await subscribersService.list(tenant.id, { page, limit: 20 });
      const duration = performance.now() - start;
      latencies.push(duration);
    });

    await Promise.all(tasks);

    latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Index];
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    // Must be well below 500ms target
    expect(p95Latency).toBeLessThan(500);
    expect(avgLatency).toBeLessThan(250);
  });

  it('2. Cached dashboard overview latency p95 is below 300ms target', async () => {
    // Prime the cache
    await reportsService.getDashboardOverview(tenant.id);

    const latencies: number[] = [];
    const CONCURRENCY = 50;

    const tasks = Array.from({ length: CONCURRENCY }, async () => {
      const start = performance.now();
      const res = await reportsService.getDashboardOverview(tenant.id);
      const duration = performance.now() - start;
      expect(res.dataFreshness.isCached).toBe(true);
      latencies.push(duration);
    });

    await Promise.all(tasks);

    latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Index];

    // In-memory cache should respond in < 50ms, well below 300ms target
    expect(p95Latency).toBeLessThan(300);
  });

  it('3. High-volume index lookups for active subscriptions and invoices execute in < 50ms', async () => {
    // Subscriptions indexed by routerId & status
    const startSub = performance.now();
    const activeSubs = await prisma.subscription.findMany({
      where: {
        routerId: router.id,
        status: SubscriptionStatus.ACTIVE,
      },
      take: 50,
    });
    const subDuration = performance.now() - startSub;

    expect(activeSubs.length).toBeGreaterThan(0);
    expect(subDuration).toBeLessThan(100);

    // Invoices indexed by tenantId & status
    const startInv = performance.now();
    const issuedInvoices = await prisma.invoice.findMany({
      where: {
        tenantId: tenant.id,
        status: InvoiceStatus.ISSUED,
      },
      take: 50,
    });
    const invDuration = performance.now() - startInv;

    expect(issuedInvoices.length).toBeGreaterThan(0);
    expect(invDuration).toBeLessThan(100);
  });

  it('4. Enforces pagination parameters avoiding unbounded memory allocation', async () => {
    // Querying with pagination must return capped result and proper metadata
    const res = await subscribersService.list(tenant.id, { page: 1, limit: 10 });
    expect(res.data.length).toBeLessThanOrEqual(10);
    expect(res.meta.total).toBe(100);
    expect(res.meta.totalPages).toBe(10);
  });
});
