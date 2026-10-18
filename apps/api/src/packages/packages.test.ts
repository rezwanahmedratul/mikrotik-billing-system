import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@mikrotik-billing/database';
import {
  BillingCycle,
  SubscriptionStatus,
} from '@mikrotik-billing/shared';
import { PackagesService } from './packages.service.js';
import { AuditService } from '../common/audit.service.js';
import { AuthService } from '../auth/auth.service.js';

describe('Internet Packages Service & Tenant Isolation', () => {
  const auditService = new AuditService();
  const authService = new AuthService(auditService);
  const service = new PackagesService(auditService);

  let tenantA: any;
  let tenantB: any;
  let adminA: any;

  beforeAll(async () => {
    const regA = await authService.registerTenant({
      tenantName: 'Packages Test ISP A',
      tenantCode: `PKG_A_${Date.now()}`,
      adminEmail: `pkg_admin_a_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Alice Package Mgr',
    });
    tenantA = regA.tenant;
    adminA = regA.user;

    const regB = await authService.registerTenant({
      tenantName: 'Packages Test ISP B',
      tenantCode: `PKG_B_${Date.now()}`,
      adminEmail: `pkg_admin_b_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Bob Package Mgr',
    });
    tenantB = regB.tenant;
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
      await prisma.subscription.deleteMany({
        where: { tenantId: tenantA.id },
      });
      await prisma.package.deleteMany({
        where: { tenantId: tenantA.id },
      });
    }
    if (tenantB?.id) {
      await prisma.subscription.deleteMany({
        where: { tenantId: tenantB.id },
      });
      await prisma.package.deleteMany({
        where: { tenantId: tenantB.id },
      });
    }
  });

  it('creates an internet package with parsed upload and download speeds', async () => {
    const created = await service.create(
      tenantA.id,
      {
        name: 'Home Fiber 10 Mbps',
        code: 'fiber-10m',
        speedLimitRaw: '10M/10M',
        priceMinor: 100000, // 1,000.00 BDT
        billingCycle: BillingCycle.MONTHLY,
        validityDays: 30,
        pppProfileName: 'profile-10M',
        description: 'Standard home fiber unlimited',
      },
      adminA.id
    );

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Home Fiber 10 Mbps');
    expect(created.code).toBe('fiber-10m');
    expect(created.uploadSpeedKbps).toBe(10240);
    expect(created.downloadSpeedKbps).toBe(10240);
    expect(created.priceMinor).toBe(100000);
    expect(created.priceFormatted).toBe('BDT 1000.00');
    expect(created.isArchived).toBe(false);
  });

  it('rejects invalid speed formats or non-positive speeds', async () => {
    await expect(
      service.create(tenantA.id, {
        name: 'Bad Speed 1',
        speedLimitRaw: 'invalid-speed',
        priceMinor: 50000,
      })
    ).rejects.toThrow('Invalid speed limit format');

    await expect(
      service.create(tenantA.id, {
        name: 'Bad Speed 2',
        speedLimitRaw: '0/10M',
        priceMinor: 50000,
      })
    ).rejects.toThrow('greater than zero');
  });

  it('enforces package code uniqueness per tenant while allowing cross-tenant reuse', async () => {
    await service.create(tenantA.id, {
      name: 'Starter Plan',
      code: 'starter',
      speedLimitRaw: '5M/5M',
      priceMinor: 50000,
    });

    // Same tenant, duplicate code -> ConflictException
    await expect(
      service.create(tenantA.id, {
        name: 'Another Starter',
        code: 'starter',
        speedLimitRaw: '5M/5M',
        priceMinor: 60000,
      })
    ).rejects.toThrow('already exists');

    // Tenant B can use the same code 'starter' without collision
    const pkgB = await service.create(tenantB.id, {
      name: 'Tenant B Starter',
      code: 'starter',
      speedLimitRaw: '5M/5M',
      priceMinor: 45000,
    });
    expect(pkgB.id).toBeDefined();
    expect(pkgB.tenantId).toBe(tenantB.id);
  });

  it('enforces strict tenant isolation on list, get, update, and delete', async () => {
    const pkgA = await service.create(tenantA.id, {
      name: 'Tenant A Exclusive Plan',
      code: 'plan-a',
      speedLimitRaw: '20M/20M',
      priceMinor: 200000,
    });

    // Tenant B cannot retrieve Tenant A's package
    await expect(service.getById(tenantB.id, pkgA.id)).rejects.toThrow('was not found');

    // Tenant B cannot update Tenant A's package
    await expect(
      service.update(tenantB.id, pkgA.id, { name: 'Hacked Plan' })
    ).rejects.toThrow('was not found');

    // Tenant B cannot delete Tenant A's package
    await expect(service.delete(tenantB.id, pkgA.id)).rejects.toThrow('was not found');

    // Tenant B's list does not include Tenant A's package
    const listB = await service.list(tenantB.id);
    expect(listB.find((p) => p.id === pkgA.id)).toBeUndefined();
  });

  it('supports archiving packages and filtering by archived state', async () => {
    const pkg = await service.create(tenantA.id, {
      name: 'Legacy 2 Mbps',
      code: 'legacy-2m',
      speedLimitRaw: '2M/2M',
      priceMinor: 30000,
    });

    let activeList = await service.list(tenantA.id, { includeArchived: false });
    expect(activeList.some((p) => p.id === pkg.id)).toBe(true);

    // Archive it
    const archived = await service.archive(tenantA.id, pkg.id, true, adminA.id);
    expect(archived.isArchived).toBe(true);

    // Should not show in default active list
    activeList = await service.list(tenantA.id, { includeArchived: false });
    expect(activeList.some((p) => p.id === pkg.id)).toBe(false);

    // Shows when includeArchived: true
    const allList = await service.list(tenantA.id, { includeArchived: true });
    expect(allList.some((p) => p.id === pkg.id)).toBe(true);

    // Unarchive it
    const restored = await service.archive(tenantA.id, pkg.id, false, adminA.id);
    expect(restored.isArchived).toBe(false);
  });

  it('prevents deletion of packages that have existing subscriptions', async () => {
    const pkg = await service.create(tenantA.id, {
      name: 'Active In-Use Plan',
      code: 'in-use-plan',
      speedLimitRaw: '15M/15M',
      priceMinor: 150000,
    });

    // Create a router for the subscription
    const router = await prisma.router.create({
      data: {
        tenantId: tenantA.id,
        name: 'Test Router For Subs',
        host: '10.0.0.1',
        port: 8728,
        username: 'admin',
        encryptedPassword: 'encrypted',
      },
    });

    // Create a subscriber and an associated subscription
    const subscriber = await prisma.subscriber.create({
      data: {
        tenantId: tenantA.id,
        accountNumber: `SUB_${Date.now()}`,
        fullName: 'Test Subscriber',
        phone: '01711223344',
      },
    });

    await prisma.subscription.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: subscriber.id,
        packageId: pkg.id,
        routerId: router.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 86400000),
      },
    });

    // Attempting to delete should throw 400 Bad Request instructing to archive
    await expect(service.delete(tenantA.id, pkg.id, adminA.id)).rejects.toThrow(
      'Cannot permanently delete package'
    );

    // Deleting subscriptions first allows clean deletion
    await prisma.subscription.deleteMany({ where: { packageId: pkg.id } });
    await prisma.subscriber.delete({ where: { id: subscriber.id } });
    await prisma.router.delete({ where: { id: router.id } });

    const delResult = await service.delete(tenantA.id, pkg.id, adminA.id);
    expect(delResult.success).toBe(true);
  });
});
