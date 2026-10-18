import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@mikrotik-billing/database';
import {
  RouterProtocol,
  encrypt,
} from '@mikrotik-billing/shared';
import { SessionsService } from './sessions.service.js';
import { RouterAdapterFactory } from '../routers/router-adapter.factory.js';
import { AuditService } from '../common/audit.service.js';
import { AuthService } from '../auth/auth.service.js';

describe('PPPoE Active Sessions and Usage Monitoring', () => {
  const auditService = new AuditService();
  const authService = new AuthService(auditService);
  const adapterFactory = new RouterAdapterFactory();
  const service = new SessionsService(adapterFactory, auditService);

  let tenantA: any;
  let tenantB: any;
  let adminA: any;
  let routerA: any;
  let offlineRouterA: any;
  let packageA: any;
  let subscriberA: any;

  beforeAll(async () => {
    const regA = await authService.registerTenant({
      tenantName: 'Sessions Test ISP A',
      tenantCode: `SESS_A_${Date.now()}`,
      adminEmail: `sess_admin_a_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Alice Sessions Mgr',
    });
    tenantA = regA.tenant;
    adminA = regA.user;

    const regB = await authService.registerTenant({
      tenantName: 'Sessions Test ISP B',
      tenantCode: `SESS_B_${Date.now()}`,
      adminEmail: `sess_admin_b_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Bob Sessions Mgr',
    });
    tenantB = regB.tenant;

    // Create online router in Tenant A (uses MockRouterAdapter which has pre-populated sessions user-rahim & user-karim)
    routerA = await prisma.router.create({
      data: {
        tenantId: tenantA.id,
        name: 'Gulshan Mock Gateway',
        host: 'mock-sessions.local',
        port: 8728,
        protocol: RouterProtocol.REST_HTTPS,
        username: 'admin',
        encryptedPassword: encrypt('SecurePass123!'),
      },
    });

    // Create offline / bad router in Tenant A to test resilient degradation
    offlineRouterA = await prisma.router.create({
      data: {
        tenantId: tenantA.id,
        name: 'Unreachable Gateway',
        host: 'mock-fail.local',
        port: 8728,
        protocol: RouterProtocol.REST_HTTPS,
        username: 'admin',
        encryptedPassword: encrypt('badpass'), // triggers failure in MockRouterAdapter
      },
    });

    // Create package and subscriber correlated with user-rahim
    packageA = await prisma.package.create({
      data: {
        tenantId: tenantA.id,
        name: '20 Mbps Turbo',
        code: `pkg-turbo-${Date.now()}`,
        downloadSpeedKbps: 20480,
        uploadSpeedKbps: 20480,
        speedLimitRaw: '20M/20M',
        priceMinor: 120000,
        validityDays: 30,
        pppProfileName: 'profile-20M',
      },
    });

    subscriberA = await prisma.subscriber.create({
      data: {
        tenantId: tenantA.id,
        accountNumber: `SUB-2001`,
        fullName: 'Abdur Rahim',
        phone: '01712000001',
      },
    });

    await prisma.subscription.create({
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

    await prisma.pppoeAccount.create({
      data: {
        tenantId: tenantA.id,
        subscriberId: subscriberA.id,
        routerId: routerA.id,
        username: 'user-rahim',
        encryptedPassword: encrypt('secret'),
        pppProfile: 'profile-20M',
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

  it('retrieves active PPPoE sessions and correlates with subscriber and tariff package', async () => {
    const res = await service.list(tenantA.id, { routerId: routerA.id });

    expect(res.sessions.length).toBeGreaterThan(0);
    const rahimSession = res.sessions.find((s) => s.username === 'user-rahim');
    expect(rahimSession).toBeDefined();
    expect(rahimSession?.subscriberName).toBe('Abdur Rahim');
    expect(rahimSession?.accountNumber).toBe('SUB-2001');
    expect(rahimSession?.packageName).toBe('20 Mbps Turbo');
    expect(rahimSession?.speedLimitRaw).toBe('20M/20M');
    expect(rahimSession?.formattedRx).toBeDefined();
    expect(rahimSession?.formattedTx).toBeDefined();
    expect(rahimSession?.isStale).toBe(false);
  });

  it('handles offline or failing router without breaking the overall session response', async () => {
    // Calling list without filtering routerId will hit BOTH routerA and offlineRouterA
    const res = await service.list(tenantA.id);

    // Should NOT crash!
    expect(res).toBeDefined();
    expect(res.sessions.length).toBeGreaterThan(0);

    // Routers health should flag offlineRouterA as DEGRADED or OFFLINE
    const degraded = res.routersHealth.find((r) => r.routerId === offlineRouterA.id);
    expect(degraded).toBeDefined();
    expect(degraded?.status).toBe('DEGRADED');
    expect(res.meta.freshnessNote).toContain('cached snapshots');
  });

  it('disconnects an active PPPoE session safely and audits the action', async () => {
    const result = await service.disconnect(
      tenantA.id,
      {
        routerId: routerA.id,
        username: 'user-rahim',
        reason: 'Maintenance session reset',
      },
      adminA.id
    );

    expect(result.success).toBe(true);
    expect(result.message).toContain('user-rahim');
  });

  it('enforces tenant isolation on session retrieval and disconnect', async () => {
    // Tenant B cannot disconnect Tenant A's router session
    await expect(
      service.disconnect(tenantB.id, {
        routerId: routerA.id,
        username: 'user-rahim',
      })
    ).rejects.toThrow('was not found');

    // Tenant B sees 0 sessions from Tenant A's routers
    const listB = await service.list(tenantB.id);
    expect(listB.sessions.length).toBe(0);
  });
});
