import { prisma } from '@mikrotik-billing/database';
import {
  RouterProtocol,
  RouterConnectionStatus,
  decrypt,
  RouterConnectionConfig,
  MockRouterAdapter,
} from '@mikrotik-billing/shared';

export interface PollResult {
  totalRouters: number;
  onlineCount: number;
  offlineCount: number;
  errors: Array<{ routerId: string; routerName: string; error: string }>;
}

export class RouterHealthPoller {
  private mockAdapter = new MockRouterAdapter();
  private concurrencyLimit = 3;

  constructor(limit = 3) {
    this.concurrencyLimit = limit;
  }

  async pollSingleRouter(router: any): Promise<{ success: boolean; error?: string }> {
    try {
      const password = decrypt(router.encryptedPassword);
      const config: RouterConnectionConfig = {
        host: router.host,
        port: router.port,
        protocol: router.protocol as RouterProtocol,
        username: router.username,
        password,
        timeoutMs: 4000,
      };

      const [health, sessions] = await Promise.all([
        this.mockAdapter.getHealth(config),
        this.mockAdapter.getActiveSessions(config).catch(() => []),
      ]);

      await prisma.router.update({
        where: { id: router.id },
        data: {
          connectionStatus:
            health.cpuLoad > 90
              ? RouterConnectionStatus.DEGRADED
              : RouterConnectionStatus.ONLINE,
          lastSeenAt: new Date(),
          rosVersion: health.rosVersion,
          uptime: health.uptime,
          cpuLoad: health.cpuLoad,
          memoryFree: BigInt(health.freeMemoryBytes),
        },
      });

      if (sessions.length > 0) {
        await prisma.activeSessionSnapshot.createMany({
          data: sessions.map((s) => ({
            routerId: router.id,
            username: s.username,
            callerId: s.callerId,
            ipAddress: s.address,
            uptime: s.uptime,
            rxBytes: BigInt(s.bytesIn),
            txBytes: BigInt(s.bytesOut),
            observedAt: new Date(),
          })),
        });
      }

      return { success: true };
    } catch (err: any) {
      let status = RouterConnectionStatus.OFFLINE;
      if (err.name === 'RouterAuthError') status = RouterConnectionStatus.AUTH_FAILED;
      else if (err.name === 'RouterUnreachableError') status = RouterConnectionStatus.UNREACHABLE;

      await prisma.router.update({
        where: { id: router.id },
        data: {
          connectionStatus: status,
        },
      });

      return { success: false, error: err.message };
    }
  }

  async pollAllRouters(): Promise<PollResult> {
    const routers = await prisma.router.findMany({
      where: { isArchived: false },
    });

    const result: PollResult = {
      totalRouters: routers.length,
      onlineCount: 0,
      offlineCount: 0,
      errors: [],
    };

    // Execute in chunks respecting concurrencyLimit
    for (let i = 0; i < routers.length; i += this.concurrencyLimit) {
      const chunk = routers.slice(i, i + this.concurrencyLimit);
      const outcomes = await Promise.all(
        chunk.map(async (r) => {
          const outcome = await this.pollSingleRouter(r);
          return { router: r, outcome };
        })
      );

      for (const item of outcomes) {
        if (item.outcome.success) {
          result.onlineCount++;
        } else {
          result.offlineCount++;
          result.errors.push({
            routerId: item.router.id,
            routerName: item.router.name,
            error: item.outcome.error || 'Unknown error',
          });
        }
      }
    }

    return result;
  }
}
