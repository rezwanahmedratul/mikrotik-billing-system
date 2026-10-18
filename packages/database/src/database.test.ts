import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from './client.js';
import {
  createTestTenant,
  createTestUser,
  createTestRouter,
  createTestPackage,
  createTestSubscriber,
} from './fixtures.js';
import {
  SubscriptionStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
} from '@mikrotik-billing/shared';

describe('Database Foundation, Constraints and Multi-Tenancy Relations', () => {
  let tenantA: any;
  let tenantB: any;

  beforeAll(async () => {
    tenantA = await createTestTenant('TENANT_A');
    tenantB = await createTestTenant('TENANT_B');
  });

  afterAll(async () => {
    // Clean up test tenants (cascades to all child relations)
    if (tenantA?.id) {
      await prisma.tenant.delete({ where: { id: tenantA.id } }).catch(() => {});
    }
    if (tenantB?.id) {
      await prisma.tenant.delete({ where: { id: tenantB.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  it('enforces unique tenant code', async () => {
    await expect(
      prisma.tenant.create({
        data: {
          name: 'Duplicate Tenant Code',
          code: tenantA.code,
          contactEmail: 'dup@example.com',
        },
      })
    ).rejects.toThrow();
  });

  it('enforces unique user email', async () => {
    const user = await createTestUser('testuser');
    await expect(
      prisma.user.create({
        data: {
          email: user.email,
          fullName: 'Duplicate Email User',
          passwordHash: 'dummyhash',
        },
      })
    ).rejects.toThrow();
  });

  it('enforces tenant-scoped router name uniqueness', async () => {
    const router = await createTestRouter(tenantA.id, 'Core-Router');

    // Same router name under Tenant A should fail
    await expect(
      prisma.router.create({
        data: {
          tenantId: tenantA.id,
          name: router.name,
          host: '192.168.10.1',
          username: 'admin',
          encryptedPassword: 'secretpassword',
        },
      })
    ).rejects.toThrow();

    // Same router name under Tenant B should SUCCEED (tenant isolation)
    const routerInTenantB = await prisma.router.create({
      data: {
        tenantId: tenantB.id,
        name: router.name,
        host: '192.168.10.1',
        username: 'admin',
        encryptedPassword: 'secretpassword',
      },
    });
    expect(routerInTenantB.id).toBeDefined();
    expect(routerInTenantB.tenantId).toBe(tenantB.id);
  });

  it('enforces tenant-scoped subscriber account number uniqueness', async () => {
    const subscriber = await createTestSubscriber(tenantA.id, 'ACC');

    // Same account number in Tenant A should fail
    await expect(
      prisma.subscriber.create({
        data: {
          tenantId: tenantA.id,
          accountNumber: subscriber.accountNumber,
          fullName: 'Another Person',
          phone: '+8801799887766',
        },
      })
    ).rejects.toThrow();

    // Same account number in Tenant B should SUCCEED (tenant isolation)
    const subscriberInTenantB = await prisma.subscriber.create({
      data: {
        tenantId: tenantB.id,
        accountNumber: subscriber.accountNumber,
        fullName: 'Another Person',
        phone: '+8801799887766',
      },
    });
    expect(subscriberInTenantB.id).toBeDefined();
    expect(subscriberInTenantB.tenantId).toBe(tenantB.id);
  });

  it('enforces tenant-scoped PPPoE username uniqueness', async () => {
    const router = await createTestRouter(tenantA.id, 'PPPoE-Router');
    const subscriber = await createTestSubscriber(tenantA.id, 'SUB-PPP');

    const pppUsername = `pppoe_user_${Date.now()}`;

    await prisma.pppoeAccount.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: subscriber.id,
        routerId: router.id,
        username: pppUsername,
        encryptedPassword: 'encrypted_pass',
        pppProfile: 'default',
      },
    });

    // Duplicate username under same tenant must fail
    await expect(
      prisma.pppoeAccount.create({
        data: {
          tenantId: tenantA.id,
          subscriberId: subscriber.id,
          routerId: router.id,
          username: pppUsername,
          encryptedPassword: 'encrypted_pass',
          pppProfile: 'default',
        },
      })
    ).rejects.toThrow();
  });

  it('prevents duplicate invoice generation for the same subscription and period', async () => {
    const router = await createTestRouter(tenantA.id, 'Inv-Router');
    const pkg = await createTestPackage(tenantA.id, 'INV_PKG', 100000);
    const sub = await createTestSubscriber(tenantA.id, 'INV_SUB');

    const now = new Date('2026-10-01T00:00:00Z');
    const nextMonth = new Date('2026-11-01T00:00:00Z');

    const subscription = await prisma.subscription.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: sub.id,
        packageId: pkg.id,
        routerId: router.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: now,
        expiryDate: nextMonth,
      },
    });

    // Create first invoice for this period
    await prisma.invoice.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: sub.id,
        subscriptionId: subscription.id,
        invoiceNumber: `INV-${Date.now()}-1`,
        billingPeriodStart: now,
        billingPeriodEnd: nextMonth,
        dueDate: new Date('2026-10-07T00:00:00Z'),
        subtotalMinor: 100000,
        totalMinor: 100000,
        balanceMinor: 100000,
        status: InvoiceStatus.ISSUED,
      },
    });

    // Attempting to generate a second invoice for the exact same subscription & period must fail
    await expect(
      prisma.invoice.create({
        data: {
          tenantId: tenantA.id,
          subscriberId: sub.id,
          subscriptionId: subscription.id,
          invoiceNumber: `INV-${Date.now()}-2`,
          billingPeriodStart: now,
          billingPeriodEnd: nextMonth,
          dueDate: new Date('2026-10-07T00:00:00Z'),
          subtotalMinor: 100000,
          totalMinor: 100000,
          balanceMinor: 100000,
          status: InvoiceStatus.ISSUED,
        },
      })
    ).rejects.toThrow();
  });

  it('restricts package deletion when referenced by active subscriptions', async () => {
    const router = await createTestRouter(tenantA.id, 'Restrict-Router');
    const pkg = await createTestPackage(tenantA.id, 'RESTRICT_PKG', 80000);
    const sub = await createTestSubscriber(tenantA.id, 'RESTRICT_SUB');

    await prisma.subscription.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: sub.id,
        packageId: pkg.id,
        routerId: router.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      },
    });

    // Deleting package referenced by active subscription must be rejected by foreign key restrict
    await expect(
      prisma.package.delete({
        where: { id: pkg.id },
      })
    ).rejects.toThrow();
  });
});
