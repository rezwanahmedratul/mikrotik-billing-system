import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@mikrotik-billing/database';
import {
  SubscriptionStatus,
  RouterProtocol,
  BillingCycle,
  encrypt,
} from '@mikrotik-billing/shared';
import { SubscribersService } from './subscribers.service.js';
import { SubscriptionsService } from './subscriptions.service.js';
import { PppoeProvisioningService } from './pppoe-provisioning.service.js';
import { RouterAdapterFactory } from '../routers/router-adapter.factory.js';
import { AuditService } from '../common/audit.service.js';
import { AuthService } from '../auth/auth.service.js';

describe('Subscriber & Subscription Management Service', () => {
  const auditService = new AuditService();
  const authService = new AuthService(auditService);
  const adapterFactory = new RouterAdapterFactory();
  const provisioningService = new PppoeProvisioningService(adapterFactory);
  const subscriptionsService = new SubscriptionsService(auditService);
  const service = new SubscribersService(
    auditService,
    provisioningService,
    subscriptionsService
  );

  let tenantA: any;
  let tenantB: any;
  let adminA: any;
  let routerA: any;
  let packageA: any;
  let packageB: any;

  beforeAll(async () => {
    const regA = await authService.registerTenant({
      tenantName: 'Subscriber Test ISP A',
      tenantCode: `SUB_A_${Date.now()}`,
      adminEmail: `sub_admin_a_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Alice Subscriber Mgr',
    });
    tenantA = regA.tenant;
    adminA = regA.user;

    const regB = await authService.registerTenant({
      tenantName: 'Subscriber Test ISP B',
      tenantCode: `SUB_B_${Date.now()}`,
      adminEmail: `sub_admin_b_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Bob Subscriber Mgr',
    });
    tenantB = regB.tenant;

    // Create test router in Tenant A (using mock host)
    routerA = await prisma.router.create({
      data: {
        tenantId: tenantA.id,
        name: 'Gulshan Mock Gateway',
        host: 'mock-router.local',
        port: 8728,
        protocol: RouterProtocol.REST_HTTPS,
        username: 'admin',
        encryptedPassword: encrypt('SecurePass123!'),
      },
    });

    // Create test package in Tenant A
    packageA = await prisma.package.create({
      data: {
        tenantId: tenantA.id,
        name: '10 Mbps Standard',
        code: `pkg-10m-${Date.now()}`,
        downloadSpeedKbps: 10240,
        uploadSpeedKbps: 10240,
        speedLimitRaw: '10M/10M',
        priceMinor: 100000,
        validityDays: 30,
        pppProfileName: 'profile-10M',
      },
    });

    // Create test package in Tenant B
    packageB = await prisma.package.create({
      data: {
        tenantId: tenantB.id,
        name: 'Tenant B Package',
        code: `pkg-b-${Date.now()}`,
        downloadSpeedKbps: 5120,
        uploadSpeedKbps: 5120,
        speedLimitRaw: '5M/5M',
        priceMinor: 50000,
        validityDays: 30,
        pppProfileName: 'profile-5M',
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
      await prisma.serviceEvent.deleteMany({ where: { tenantId: tenantA.id } });
      await prisma.subscription.deleteMany({ where: { tenantId: tenantA.id } });
      await prisma.pppoeAccount.deleteMany({ where: { tenantId: tenantA.id } });
      await prisma.subscriber.deleteMany({ where: { tenantId: tenantA.id } });
    }
  });

  it('creates subscriber, sets up subscription, and provisions PPPoE account on router without exposing raw password', async () => {
    const subscriber = await service.create(
      tenantA.id,
      {
        fullName: 'Zahirul Islam',
        phone: '01712345678',
        email: 'zahir@example.com',
        address: 'House 42, Road 11, Banani, Dhaka',
        packageId: packageA.id,
        routerId: routerA.id,
        pppoeUsername: 'zahir_banani',
        pppoePassword: 'SecretClientPassword123!',
      },
      adminA.id
    );

    expect(subscriber.id).toBeDefined();
    expect(subscriber.accountNumber).toMatch(/^SUB-\d{4}$/);
    expect(subscriber.fullName).toBe('Zahirul Islam');
    expect(subscriber.phone).toBe('01712345678');

    // Subscription created
    expect(subscriber.currentSubscription).toBeDefined();
    expect(subscriber.currentSubscription?.packageName).toBe('10 Mbps Standard');
    expect(subscriber.currentSubscription?.status).toBe(SubscriptionStatus.ACTIVE);
    expect(subscriber.currentSubscription?.daysRemaining).toBeGreaterThanOrEqual(29);

    // PPPoE account created and confirmed on router
    expect(subscriber.pppoeAccount).toBeDefined();
    expect(subscriber.pppoeAccount?.username).toBe('zahir_banani');
    expect(subscriber.pppoeAccount?.hasPassword).toBe(true);
    // Raw password MUST NOT be exposed
    expect((subscriber.pppoeAccount as any).password).toBeUndefined();
    expect((subscriber.pppoeAccount as any).encryptedPassword).toBeUndefined();
    expect(subscriber.pppoeAccount?.confirmedOnRouter).toBe(true);
    expect(subscriber.pppoeAccount?.isSuspended).toBe(false);
  });

  it('enforces tenant-scoped PPPoE username uniqueness', async () => {
    await service.create(
      tenantA.id,
      {
        fullName: 'Subscriber One',
        phone: '01811111111',
        packageId: packageA.id,
        routerId: routerA.id,
        pppoeUsername: 'user_shared',
      },
      adminA.id
    );

    // Same tenant, duplicate username -> ConflictException
    await expect(
      service.create(
        tenantA.id,
        {
          fullName: 'Subscriber Two',
          phone: '01822222222',
          packageId: packageA.id,
          routerId: routerA.id,
          pppoeUsername: 'user_shared',
        },
        adminA.id
      )
    ).rejects.toThrow('already exists');
  });

  it('enforces cross-tenant isolation on subscriber queries and operations', async () => {
    const subA = await service.create(
      tenantA.id,
      {
        fullName: 'Tenant A Subscriber',
        phone: '01911111111',
        packageId: packageA.id,
        routerId: routerA.id,
      },
      adminA.id
    );

    // Tenant B cannot retrieve Tenant A's subscriber
    await expect(service.getById(tenantB.id, subA.id)).rejects.toThrow('was not found');

    // Tenant B cannot update Tenant A's subscriber
    await expect(
      service.update(tenantB.id, subA.id, { fullName: 'Hacked Name' })
    ).rejects.toThrow('was not found');

    // Tenant B cannot suspend Tenant A's subscriber
    await expect(
      service.changeServiceStatus(tenantB.id, subA.id, { status: 'SUSPENDED' })
    ).rejects.toThrow('was not found');

    // Tenant B list does not leak Tenant A's subscriber
    const listB = await service.list(tenantB.id);
    expect(listB.data.some((s) => s.id === subA.id)).toBe(false);
  });

  it('suspends and restores service, updating router state and recording service event history', async () => {
    const sub = await service.create(
      tenantA.id,
      {
        fullName: 'Monthly Client',
        phone: '01611111111',
        packageId: packageA.id,
        routerId: routerA.id,
        pppoeUsername: 'monthly_cutoff_user',
      },
      adminA.id
    );

    // 1. Suspend service
    const suspended = await service.changeServiceStatus(
      tenantA.id,
      sub.id,
      { status: 'SUSPENDED', reason: 'Non-payment of monthly invoice' },
      adminA.id
    );

    expect(suspended.currentSubscription?.status).toBe(SubscriptionStatus.SUSPENDED);
    expect(suspended.pppoeAccount?.isSuspended).toBe(true);

    // Service Event recorded
    expect(suspended.serviceEvents.length).toBeGreaterThan(0);
    const suspendEvent = suspended.serviceEvents.find((e) => e.type === 'SUSPENDED');
    expect(suspendEvent).toBeDefined();
    expect(suspendEvent?.reason).toBe('Non-payment of monthly invoice');

    // 2. Restore service
    const restored = await service.changeServiceStatus(
      tenantA.id,
      sub.id,
      { status: 'ACTIVE', reason: 'Payment received in full' },
      adminA.id
    );

    expect(restored.currentSubscription?.status).toBe(SubscriptionStatus.ACTIVE);
    expect(restored.pppoeAccount?.isSuspended).toBe(false);

    const restoreEvent = restored.serviceEvents.find((e) => e.type === 'RESTORED');
    expect(restoreEvent).toBeDefined();
    expect(restoreEvent?.reason).toBe('Payment received in full');
  });

  it('allows manual subscription renewal extending validity', async () => {
    const sub = await service.create(
      tenantA.id,
      {
        fullName: 'Renewal Client',
        phone: '01511111111',
        packageId: packageA.id,
        routerId: routerA.id,
        expiryDays: 5,
      },
      adminA.id
    );

    const detail = await service.getById(tenantA.id, sub.id);
    const subId = detail.subscriptions[0].id;

    const renewed = await subscriptionsService.renewSubscription(
      tenantA.id,
      subId,
      30,
      adminA.id
    );

    expect(renewed.status).toBe(SubscriptionStatus.ACTIVE);
    expect(renewed.daysRemaining).toBeGreaterThanOrEqual(30);
  });
});
