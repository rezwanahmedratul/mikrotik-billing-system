import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@mikrotik-billing/database';
import {
  decrypt,
  formatBytes,
  RouterAdapter,
  RouterConnectionConfig,
  AuditAction,
} from '@mikrotik-billing/shared';
import { RouterAdapterFactory } from '../routers/router-adapter.factory';
import { AuditService } from '../common/audit.service';
import {
  SessionQueryDto,
  SessionsListResponse,
  SessionItemResponse,
  RouterSessionHealth,
  DisconnectSessionDto,
} from './sessions.dto';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);
  private readonly prisma = prisma;

  constructor(
    private readonly adapterFactory: RouterAdapterFactory,
    private readonly auditService: AuditService
  ) {}

  private getRouterConfig(router: any): RouterConnectionConfig {
    const password = decrypt(router.encryptedPassword);
    return {
      host: router.host,
      port: router.port,
      protocol: router.protocol,
      username: router.username,
      password,
    };
  }

  async list(tenantId: string, query: SessionQueryDto = {}): Promise<SessionsListResponse> {
    const routerWhere: any = { tenantId, isArchived: false };
    if (query.routerId) {
      routerWhere.id = query.routerId;
    }

    const routers = await this.prisma.router.findMany({
      where: routerWhere,
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        protocol: true,
        username: true,
        encryptedPassword: true,
        connectionStatus: true,
        lastSeenAt: true,
      },
    });

    const allSessions: SessionItemResponse[] = [];
    const routersHealth: RouterSessionHealth[] = [];

    let totalRxBytes = 0;
    let totalTxBytes = 0;
    const now = new Date();

    // Map all tenant PPPoE accounts for rapid local correlation
    const pppoeAccounts = await this.prisma.pppoeAccount.findMany({
      where: { tenantId },
      include: {
        subscriber: {
          select: {
            id: true,
            fullName: true,
            accountNumber: true,
            subscriptions: {
              where: { status: 'ACTIVE' },
              take: 1,
              include: { package: true },
            },
          },
        },
      },
    });

    const accountMap = new Map<string, any>();
    for (const acc of pppoeAccounts) {
      accountMap.set(acc.username.toLowerCase(), acc);
    }

    // Query routers concurrently; failures in one router NEVER break the response
    await Promise.all(
      routers.map(async (router) => {
        let routerSessions: SessionItemResponse[] = [];
        let status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' = 'ONLINE';
        let routerError: string | undefined;

        try {
          const config = this.getRouterConfig(router);
          const adapter: RouterAdapter = this.adapterFactory.getAdapter(config);

          const liveSessions = await adapter.getActiveSessions(config);

          routerSessions = liveSessions.map((s) => {
            const correlated = accountMap.get(s.username.toLowerCase());
            const activeSub = correlated?.subscriber?.subscriptions?.[0];

            totalRxBytes += s.bytesIn || 0;
            totalTxBytes += s.bytesOut || 0;

            return {
              id: s.id || `${router.id}-${s.username}`,
              username: s.username,
              subscriberId: correlated?.subscriber?.id || null,
              subscriberName: correlated?.subscriber?.fullName || null,
              accountNumber: correlated?.subscriber?.accountNumber || null,
              packageName: activeSub?.package?.name || null,
              speedLimitRaw: activeSub?.package?.speedLimitRaw || null,
              routerId: router.id,
              routerName: router.name,
              service: s.service || 'pppoe',
              callerId: s.callerId || null,
              ipAddress: s.address || null,
              uptime: s.uptime || '0s',
              bytesIn: s.bytesIn || 0,
              bytesOut: s.bytesOut || 0,
              formattedRx: formatBytes(s.bytesIn),
              formattedTx: formatBytes(s.bytesOut),
              sessionId: s.sessionId || null,
              isStale: false,
              observedAt: now.toISOString(),
            };
          });

          // Snapshot in DB for graceful fallback
          if (liveSessions.length > 0) {
            Promise.resolve().then(async () => {
              try {
                await this.prisma.activeSessionSnapshot.deleteMany({
                  where: { routerId: router.id },
                });
                await this.prisma.activeSessionSnapshot.createMany({
                  data: liveSessions.map((s) => ({
                    routerId: router.id,
                    username: s.username,
                    callerId: s.callerId || null,
                    ipAddress: s.address || null,
                    uptime: s.uptime || '0s',
                    rxBytes: BigInt(s.bytesIn || 0),
                    txBytes: BigInt(s.bytesOut || 0),
                    observedAt: now,
                  })),
                });
              } catch (e: any) {
                this.logger.warn(`Could not persist session snapshot for ${router.name}: ${e.message}`);
              }
            });
          }
        } catch (err: any) {
          this.logger.warn(
            `Live session poll failed for router '${router.name}': ${err.message}. Falling back to cached snapshot.`
          );
          status = 'DEGRADED';
          routerError = err.message;

          // Fallback to cached snapshots
          const snapshots = await this.prisma.activeSessionSnapshot.findMany({
            where: { routerId: router.id },
            orderBy: { observedAt: 'desc' },
            take: 100,
          });

          routerSessions = snapshots.map((snap) => {
            const correlated = accountMap.get(snap.username.toLowerCase());
            const activeSub = correlated?.subscriber?.subscriptions?.[0];
            const rx = snap.rxBytes ? Number(snap.rxBytes) : 0;
            const tx = snap.txBytes ? Number(snap.txBytes) : 0;

            totalRxBytes += rx;
            totalTxBytes += tx;

            return {
              id: snap.id,
              username: snap.username,
              subscriberId: correlated?.subscriber?.id || null,
              subscriberName: correlated?.subscriber?.fullName || null,
              accountNumber: correlated?.subscriber?.accountNumber || null,
              packageName: activeSub?.package?.name || null,
              speedLimitRaw: activeSub?.package?.speedLimitRaw || null,
              routerId: router.id,
              routerName: router.name,
              service: 'pppoe',
              callerId: snap.callerId,
              ipAddress: snap.ipAddress,
              uptime: snap.uptime || '0s',
              bytesIn: rx,
              bytesOut: tx,
              formattedRx: formatBytes(rx),
              formattedTx: formatBytes(tx),
              sessionId: null,
              isStale: true,
              observedAt: snap.observedAt.toISOString(),
            };
          });
        }

        allSessions.push(...routerSessions);
        routersHealth.push({
          routerId: router.id,
          routerName: router.name,
          host: router.host,
          status,
          activeSessionsCount: routerSessions.length,
          lastSyncAt: now.toISOString(),
          error: routerError,
        });
      })
    );

    // Apply client filters
    let filteredSessions = allSessions;
    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      filteredSessions = filteredSessions.filter(
        (s) =>
          s.username.toLowerCase().includes(q) ||
          s.subscriberName?.toLowerCase().includes(q) ||
          s.accountNumber?.toLowerCase().includes(q) ||
          s.ipAddress?.includes(q) ||
          s.callerId?.toLowerCase().includes(q)
      );
    }

    return {
      sessions: filteredSessions,
      routersHealth,
      meta: {
        totalSessions: filteredSessions.length,
        totalRxBytes,
        totalTxBytes,
        formattedTotalRx: formatBytes(totalRxBytes),
        formattedTotalTx: formatBytes(totalTxBytes),
        lastPolledAt: now.toISOString(),
        freshnessNote:
          routersHealth.some((r) => r.status === 'DEGRADED')
            ? 'One or more routers responded with cached snapshots. Look for the Stale badge.'
            : 'Live sync verified across all active gateway routers.',
      },
    };
  }

  async disconnect(
    tenantId: string,
    dto: DisconnectSessionDto,
    userId?: string
  ): Promise<{ success: boolean; message: string }> {
    const router = await this.prisma.router.findFirst({
      where: { id: dto.routerId, tenantId },
    });

    if (!router) {
      throw new NotFoundException(`Router '${dto.routerId}' was not found in your organization.`);
    }

    try {
      const config = this.getRouterConfig(router);
      const adapter: RouterAdapter = this.adapterFactory.getAdapter(config);

      await adapter.disconnectSession(config, dto.username);

      if (userId) {
        await this.auditService.log({
          tenantId,
          userId,
          action: AuditAction.CONFIG_CHANGED,
          entityType: 'ROUTER',
          entityId: router.id,
          details: {
            action: 'DISCONNECT_PPPOE_SESSION',
            username: dto.username,
            reason: dto.reason || 'Manual operator disconnect',
          },
        });
      }

      return {
        success: true,
        message: `Session for user '${dto.username}' on router '${router.name}' was terminated.`,
      };
    } catch (err: any) {
      throw new BadRequestException(
        `Failed to disconnect session on router '${router.name}': ${err.message}`
      );
    }
  }
}
