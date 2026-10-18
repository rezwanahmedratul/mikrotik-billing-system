import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@mikrotik-billing/database';
import {
  RouterProtocol,
  RouterConnectionStatus,
  decrypt,
} from '@mikrotik-billing/shared';
import { RoutersService } from './routers.service.js';
import { RouterAdapterFactory } from './router-adapter.factory.js';
import { AuditService } from '../common/audit.service.js';
import { AuthService } from '../auth/auth.service.js';

describe('Router Inventory, Secure Connections & Tenant Isolation', () => {
  const auditService = new AuditService();
  const authService = new AuthService(auditService);
  const adapterFactory = new RouterAdapterFactory();
  const service = new RoutersService(auditService, adapterFactory);

  let tenantA: any;
  let tenantB: any;
  let adminA: any;

  beforeAll(async () => {
    // Dynamically register 2 isolated test tenants
    const regA = await authService.registerTenant({
      tenantName: 'Router Test ISP A',
      tenantCode: `RTR_A_${Date.now()}`,
      adminEmail: `rtr_admin_a_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Alice Operator',
    });
    tenantA = regA.tenant;
    adminA = regA.user;

    const regB = await authService.registerTenant({
      tenantName: 'Router Test ISP B',
      tenantCode: `RTR_B_${Date.now()}`,
      adminEmail: `rtr_admin_b_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Bob Operator',
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
    // Clean up test routers created by previous tests in these tenants
    if (tenantA?.id) {
      await prisma.activeSessionSnapshot.deleteMany({
        where: { router: { tenantId: tenantA.id } },
      });
      await prisma.router.deleteMany({
        where: { tenantId: tenantA.id },
      });
    }
    if (tenantB?.id) {
      await prisma.router.deleteMany({
        where: { tenantId: tenantB.id },
      });
    }
  });

  it('registers a router with encrypted password and redacts credentials from summary', async () => {
    const created = await service.create(
      tenantA.id,
      {
        name: 'Test-CCR2004-A',
        host: '192.168.88.1',
        port: 8728,
        protocol: RouterProtocol.REST_HTTPS,
        username: 'admin',
        password: 'SecretMikrotikAdminPass123!',
        testImmediately: false,
      },
      adminA.id
    );

    expect(created.id).toBeDefined();
    expect(created.name).toBe('Test-CCR2004-A');
    expect(created.hasPassword).toBe(true);

    // Verify plaintext password is not in API response
    expect((created as any).password).toBeUndefined();
    expect((created as any).encryptedPassword).toBeUndefined();

    // Verify directly in database that password is encrypted with AES-256-GCM
    const dbRecord = await prisma.router.findUnique({ where: { id: created.id } });
    expect(dbRecord).not.toBeNull();
    expect(dbRecord!.encryptedPassword).not.toBe('SecretMikrotikAdminPass123!');
    expect(dbRecord!.encryptedPassword.split(':').length).toBe(3);

    // Verify it decrypts back to original password
    const decrypted = decrypt(dbRecord!.encryptedPassword);
    expect(decrypted).toBe('SecretMikrotikAdminPass123!');
  });

  it('enforces tenant-scoped unique router name and allows same name in different tenant', async () => {
    await service.create(
      tenantA.id,
      {
        name: 'Test-Duplicate',
        host: '192.168.88.10',
        username: 'admin',
        password: 'Pass123!Safe',
        testImmediately: false,
      },
      adminA.id
    );

    // Duplicate in Tenant A must fail
    await expect(
      service.create(
        tenantA.id,
        {
          name: 'Test-Duplicate',
          host: '192.168.88.11',
          username: 'admin',
          password: 'Pass123!Safe',
          testImmediately: false,
        },
        adminA.id
      )
    ).rejects.toThrow();

    // Same name in Tenant B must succeed
    const tenantBRouter = await service.create(
      tenantB.id,
      {
        name: 'Test-Duplicate',
        host: '192.168.88.20',
        username: 'admin',
        password: 'Pass123!Safe',
        testImmediately: false,
      },
      adminA.id
    );
    expect(tenantBRouter.id).toBeDefined();
    expect(tenantBRouter.tenantId).toBe(tenantB.id);
  });

  it('tests connection and updates status to ONLINE with telemetry on success', async () => {
    const router = await service.create(
      tenantA.id,
      {
        name: 'Test-CCR2004-A',
        host: '192.168.88.1',
        username: 'admin',
        password: 'CorrectPass123!',
        testImmediately: false,
      },
      adminA.id
    );

    const testRes = await service.testConnection(tenantA.id, router.id);
    expect(testRes.success).toBe(true);
    expect(testRes.identity).toBe('FastNet-Core-CCR2004');
    expect(testRes.rosVersion).toBe('7.14.3');

    // Verify database status updated
    const refreshed = await service.getById(tenantA.id, router.id);
    expect(refreshed.connectionStatus).toBe(RouterConnectionStatus.ONLINE);
    expect(refreshed.lastSeenAt).not.toBeNull();
  });

  it('marks router AUTH_FAILED on invalid credentials without crashing', async () => {
    const router = await service.create(
      tenantA.id,
      {
        name: 'Test-Fail-Auth',
        host: '192.168.88.1',
        username: 'admin',
        password: 'badpass',
        testImmediately: false,
      },
      adminA.id
    );

    const testRes = await service.testConnection(tenantA.id, router.id);
    expect(testRes.success).toBe(false);
    expect(testRes.error).toContain('authentication failed');

    const refreshed = await service.getById(tenantA.id, router.id);
    expect(refreshed.connectionStatus).toBe(RouterConnectionStatus.AUTH_FAILED);
  });

  it('marks router TIMEOUT/OFFLINE on timeout without blocking platform', async () => {
    const router = await service.create(
      tenantA.id,
      {
        name: 'Test-Timeout',
        host: 'timeout.local',
        username: 'admin',
        password: 'CorrectPass123!',
        testImmediately: false,
      },
      adminA.id
    );

    const testRes = await service.testConnection(tenantA.id, router.id);
    expect(testRes.success).toBe(false);

    const refreshed = await service.getById(tenantA.id, router.id);
    expect(refreshed.connectionStatus).toBe(RouterConnectionStatus.OFFLINE);
  });

  it('enforces strict multi-tenant boundary on router access', async () => {
    const routerA = await service.create(
      tenantA.id,
      {
        name: 'Test-CCR2004-A',
        host: '192.168.88.1',
        username: 'admin',
        password: 'CorrectPass123!',
        testImmediately: false,
      },
      adminA.id
    );

    // Tenant B cannot retrieve Tenant A's router
    await expect(service.getById(tenantB.id, routerA.id)).rejects.toThrow();

    // Tenant B cannot test Tenant A's router
    await expect(service.testConnection(tenantB.id, routerA.id)).rejects.toThrow();

    // Tenant B cannot update Tenant A's router
    await expect(service.update(tenantB.id, routerA.id, { name: 'Hacked' })).rejects.toThrow();

    // Tenant B cannot delete Tenant A's router
    await expect(service.delete(tenantB.id, routerA.id)).rejects.toThrow();

    // Verify router in Tenant A is unchanged
    const secureRouter = await service.getById(tenantA.id, routerA.id);
    expect(secureRouter.name).toBe('Test-CCR2004-A');
  });
});
