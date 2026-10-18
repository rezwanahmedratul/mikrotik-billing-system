import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@mikrotik-billing/database';
import {
  RouterProtocol,
  RouterConnectionStatus,
  AuditAction,
  encrypt,
  decrypt,
  RouterConnectionConfig,
} from '@mikrotik-billing/shared';
import { AuditService } from '../common/audit.service';
import { RouterAdapterFactory } from './router-adapter.factory';
import {
  CreateRouterDto,
  UpdateRouterDto,
  TestRouterConnectionDto,
  RouterSummaryResponse,
} from './routers.dto';

@Injectable()
export class RoutersService {
  private readonly prisma = prisma;

  constructor(
    private readonly auditService: AuditService,
    private readonly adapterFactory: RouterAdapterFactory
  ) {}

  private mapToSummary(router: any, activeCount = 0): RouterSummaryResponse {
    return {
      id: router.id,
      tenantId: router.tenantId,
      name: router.name,
      host: router.host,
      port: router.port,
      protocol: router.protocol as RouterProtocol,
      username: router.username,
      hasPassword: true,
      connectionStatus: router.connectionStatus,
      lastSeenAt: router.lastSeenAt ? router.lastSeenAt.toISOString() : null,
      rosVersion: router.rosVersion,
      uptime: router.uptime,
      cpuLoad: router.cpuLoad,
      memoryFree: router.memoryFree ? Number(router.memoryFree) : null,
      isArchived: router.isArchived,
      createdAt: router.createdAt.toISOString(),
      updatedAt: router.updatedAt.toISOString(),
      activeSessionsCount: activeCount,
    };
  }

  async list(tenantId: string): Promise<RouterSummaryResponse[]> {
    const routers = await this.prisma.router.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            pppoeAccounts: true,
          },
        },
      },
    });

    return routers.map((r) => {
      return this.mapToSummary(r, r._count.pppoeAccounts);
    });
  }

  async getById(tenantId: string, id: string): Promise<RouterSummaryResponse> {
    const router = await this.prisma.router.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            pppoeAccounts: true,
          },
        },
      },
    });

    if (!router) {
      throw new NotFoundException(`Router with ID '${id}' was not found in your organization.`);
    }

    return this.mapToSummary(router, router._count.pppoeAccounts);
  }

  async create(
    tenantId: string,
    dto: CreateRouterDto,
    userId?: string
  ): Promise<RouterSummaryResponse> {
    if (!dto.name || !dto.host || !dto.username || !dto.password) {
      throw new BadRequestException('Name, host, username, and password are required fields.');
    }

    // Check duplicate router name within tenant
    const existing = await this.prisma.router.findFirst({
      where: { tenantId, name: dto.name.trim() },
    });

    if (existing) {
      throw new ConflictException(
        `A router with the name '${dto.name.trim()}' already exists in your organization.`
      );
    }

    const encryptedPassword = encrypt(dto.password);

    const router = await this.prisma.router.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        host: dto.host.trim(),
        port: dto.port || 8728,
        protocol: (dto.protocol as any) || RouterProtocol.REST_HTTPS,
        username: dto.username.trim(),
        encryptedPassword,
        connectionStatus: RouterConnectionStatus.UNKNOWN,
      },
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.ROUTER_CREATED,
        entityType: 'ROUTER',
        entityId: router.id,
        details: {
          name: router.name,
          host: router.host,
          port: router.port,
          protocol: router.protocol,
        },
      });
    }

    // Attempt test immediately if requested
    if (dto.testImmediately !== false) {
      try {
        await this.testConnection(tenantId, router.id);
        const refreshed = await this.prisma.router.findUnique({ where: { id: router.id } });
        return this.mapToSummary(refreshed || router);
      } catch {
        // Ignored; router creation still succeeds with OFFLINE/UNKNOWN status
      }
    }

    return this.mapToSummary(router);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateRouterDto,
    userId?: string
  ): Promise<RouterSummaryResponse> {
    const existing = await this.prisma.router.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException(`Router with ID '${id}' was not found.`);
    }

    if (dto.name && dto.name.trim() !== existing.name) {
      const duplicate = await this.prisma.router.findFirst({
        where: { tenantId, name: dto.name.trim(), NOT: { id } },
      });
      if (duplicate) {
        throw new ConflictException(
          `A router with name '${dto.name.trim()}' already exists in your organization.`
        );
      }
    }

    const data: any = {};
    if (dto.name) data.name = dto.name.trim();
    if (dto.host) data.host = dto.host.trim();
    if (dto.port) data.port = dto.port;
    if (dto.protocol) data.protocol = dto.protocol;
    if (dto.username) data.username = dto.username.trim();
    if (dto.password) data.encryptedPassword = encrypt(dto.password);
    if (typeof dto.isArchived === 'boolean') data.isArchived = dto.isArchived;

    const updated = await this.prisma.router.update({
      where: { id },
      data,
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.ROUTER_UPDATED,
        entityType: 'ROUTER',
        entityId: updated.id,
        details: {
          name: updated.name,
          host: updated.host,
          port: updated.port,
          isArchived: updated.isArchived,
        },
      });
    }

    return this.mapToSummary(updated);
  }

  async testConnection(
    tenantId: string,
    id: string,
    overrideDto?: TestRouterConnectionDto
  ): Promise<{
    success: boolean;
    latencyMs: number;
    identity?: string;
    rosVersion?: string;
    boardName?: string;
    uptime?: string;
    error?: string;
  }> {
    const router = await this.prisma.router.findFirst({
      where: { id, tenantId },
    });

    if (!router) {
      throw new NotFoundException(`Router with ID '${id}' was not found.`);
    }

    const password = overrideDto?.password || decrypt(router.encryptedPassword);
    const host = overrideDto?.host || router.host;
    const port = overrideDto?.port || router.port;
    const protocol = (overrideDto?.protocol || router.protocol) as RouterProtocol;
    const username = overrideDto?.username || router.username;

    const config: RouterConnectionConfig = {
      host,
      port,
      protocol,
      username,
      password,
    };

    const adapter = this.adapterFactory.getAdapter(config);

    try {
      const result = await adapter.testConnection(config);

      if (result.success) {
        await this.prisma.router.update({
          where: { id },
          data: {
            connectionStatus: RouterConnectionStatus.ONLINE,
            lastSeenAt: new Date(),
            rosVersion: result.rosVersion || router.rosVersion,
            uptime: result.uptime || router.uptime,
          },
        });
      } else {
        await this.prisma.router.update({
          where: { id },
          data: {
            connectionStatus: RouterConnectionStatus.OFFLINE,
          },
        });
      }

      return result;
    } catch (err: any) {
      let status = RouterConnectionStatus.OFFLINE;
      if (err.name === 'RouterAuthError') status = RouterConnectionStatus.AUTH_FAILED;
      else if (err.name === 'RouterUnreachableError') status = RouterConnectionStatus.UNREACHABLE;

      await this.prisma.router.update({
        where: { id },
        data: { connectionStatus: status },
      });

      return {
        success: false,
        latencyMs: 0,
        error: err.message || 'Connection attempt failed',
      };
    }
  }

  async syncHealth(tenantId: string, id: string): Promise<RouterSummaryResponse> {
    const router = await this.prisma.router.findFirst({
      where: { id, tenantId },
    });

    if (!router) {
      throw new NotFoundException(`Router with ID '${id}' was not found.`);
    }

    const password = decrypt(router.encryptedPassword);
    const config: RouterConnectionConfig = {
      host: router.host,
      port: router.port,
      protocol: router.protocol as RouterProtocol,
      username: router.username,
      password,
    };

    const adapter = this.adapterFactory.getAdapter(config);
    const [snapshot, sessions] = await Promise.all([
      adapter.getHealth(config),
      adapter.getActiveSessions(config).catch(() => []),
    ]);

    if (sessions.length > 0) {
      await this.prisma.activeSessionSnapshot.createMany({
        data: sessions.map((s) => ({
          routerId: id,
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

    const updated = await this.prisma.router.update({
      where: { id },
      data: {
        connectionStatus:
          snapshot.cpuLoad > 90
            ? RouterConnectionStatus.DEGRADED
            : RouterConnectionStatus.ONLINE,
        lastSeenAt: new Date(),
        rosVersion: snapshot.rosVersion,
        uptime: snapshot.uptime,
        cpuLoad: snapshot.cpuLoad,
        memoryFree: BigInt(snapshot.freeMemoryBytes),
      },
    });

    return this.mapToSummary(updated, snapshot.activeSessionsCount);
  }

  async delete(tenantId: string, id: string, userId?: string): Promise<{ success: boolean }> {
    const router = await this.prisma.router.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            pppoeAccounts: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!router) {
      throw new NotFoundException(`Router with ID '${id}' was not found.`);
    }

    if (router._count.pppoeAccounts > 0 || router._count.subscriptions > 0) {
      throw new BadRequestException(
        `Cannot remove router '${router.name}' because ${router._count.pppoeAccounts} PPPoE account(s) and ${router._count.subscriptions} subscription(s) are actively bound to it. Please reassign subscribers or archive the router instead.`
      );
    }

    await this.prisma.router.delete({
      where: { id },
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.ROUTER_DELETED,
        entityType: 'ROUTER',
        entityId: id,
        details: { name: router.name, host: router.host },
      });
    }

    return { success: true };
  }
}
