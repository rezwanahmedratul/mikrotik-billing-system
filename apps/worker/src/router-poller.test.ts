import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@mikrotik-billing/database';
import {
  RouterProtocol,
  RouterConnectionStatus,
  encrypt,
} from '@mikrotik-billing/shared';
import { RouterHealthPoller } from './router-poller';

describe('Router Background Health Poller & Failure Isolation', () => {
  const poller = new RouterHealthPoller(2); // limit 2 concurrent
  let testTenant: any;
  let onlineRouter: any;
  let offlineRouter: any;

  beforeAll(async () => {
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Poller Test Tenant',
        code: `POLL_${Date.now()}`,
        contactEmail: `poller_${Date.now()}@example.com`,
      },
    });

    onlineRouter = await prisma.router.create({
      data: {
        tenantId: testTenant.id,
        name: 'Poller-Online-Router',
        host: '192.168.88.1',
        port: 8728,
        protocol: RouterProtocol.REST_HTTPS,
        username: 'admin',
        encryptedPassword: encrypt('ValidPass123!'),
        connectionStatus: RouterConnectionStatus.UNKNOWN,
      },
    });

    offlineRouter = await prisma.router.create({
      data: {
        tenantId: testTenant.id,
        name: 'Poller-Offline-Router',
        host: 'timeout.local',
        port: 8728,
        protocol: RouterProtocol.REST_HTTPS,
        username: 'admin',
        encryptedPassword: encrypt('ValidPass123!'),
        connectionStatus: RouterConnectionStatus.UNKNOWN,
      },
    });
  });

  afterAll(async () => {
    if (testTenant?.id) {
      await prisma.activeSessionSnapshot.deleteMany({
        where: { router: { tenantId: testTenant.id } },
      });
      await prisma.router.deleteMany({
        where: { tenantId: testTenant.id },
      });
      await prisma.tenant.delete({
        where: { id: testTenant.id },
      }).catch(() => {});
    }
  });

  it('polls routers with concurrency limits and ensures offline router does not block online router', async () => {
    const outcome = await poller.pollAllRouters();

    expect(outcome.totalRouters).toBeGreaterThanOrEqual(2);
    expect(outcome.onlineCount).toBeGreaterThanOrEqual(1);
    expect(outcome.offlineCount).toBeGreaterThanOrEqual(1);

    // Verify online router was updated successfully
    const refreshedOnline = await prisma.router.findUnique({
      where: { id: onlineRouter.id },
    });
    expect(refreshedOnline!.connectionStatus).toBe(RouterConnectionStatus.ONLINE);
    expect(refreshedOnline!.cpuLoad).toBe(18);
    expect(refreshedOnline!.lastSeenAt).not.toBeNull();

    // Verify offline router was marked OFFLINE without throwing an unhandled rejection
    const refreshedOffline = await prisma.router.findUnique({
      where: { id: offlineRouter.id },
    });
    expect(refreshedOffline!.connectionStatus).toBe(RouterConnectionStatus.OFFLINE);
  });
});
