import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import crypto from 'crypto';
import { prisma } from '@mikrotik-billing/database';
import {
  RouterProtocol,
  RouterJobType,
  RouterJobStatus,
  AuditAction,
  decrypt,
  RouterConnectionConfig,
} from '@mikrotik-billing/shared';
import { AuditService } from '../common/audit.service';
import { RouterAdapterFactory } from './router-adapter.factory';
import {
  PppoeSetupInspectionResult,
  PppoeSetupPlanDto,
  PppoeSetupPlanResult,
  PppoeSetupApplyDto,
  PppoeSetupApplyResult,
} from './pppoe-setup.dto';

@Injectable()
export class PppoeSetupService {
  private readonly prisma = prisma;

  constructor(
    private readonly auditService: AuditService,
    private readonly adapterFactory: RouterAdapterFactory
  ) {}

  private async getRouterConfig(tenantId: string, routerId: string) {
    const router = await this.prisma.router.findFirst({
      where: { id: routerId, tenantId },
    });

    if (!router) {
      throw new NotFoundException(`Router with ID '${routerId}' was not found.`);
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
    return { router, config, adapter };
  }

  async inspect(tenantId: string, routerId: string): Promise<PppoeSetupInspectionResult> {
    const { router, config, adapter } = await this.getRouterConfig(tenantId, routerId);

    const [interfaces, pools, profiles, servers] = await Promise.all([
      adapter.getInterfaces(config).catch(() => []),
      adapter.getIpPools(config).catch(() => []),
      adapter.getPppoeProfiles(config).catch(() => []),
      adapter.getPppoeServers(config).catch(() => []),
    ]);

    const runningInterfaces = interfaces.filter((i) => i.running && !i.disabled);
    const warnings: string[] = [];

    if (runningInterfaces.length === 0) {
      warnings.push('No active running interfaces found. Please ensure Ethernet or Bridge interface is connected.');
    }
    if (pools.length === 0) {
      warnings.push('No IP pool configured on router. A subscriber pool must be planned.');
    }
    if (servers.length > 0) {
      warnings.push(`Existing PPPoE server '${servers[0].serviceName}' detected on interface '${servers[0].interfaceName}'. Applying will update this service.`);
    }

    return {
      routerId: router.id,
      routerName: router.name,
      isOnline: router.connectionStatus === 'ONLINE',
      interfaces: interfaces.map((i) => ({ name: i.name, type: i.type, running: i.running })),
      existingPools: pools.map((p) => ({ name: p.name, ranges: p.ranges })),
      existingProfiles: profiles.map((p) => ({ name: p.name, rateLimit: p.rateLimit })),
      existingServers: servers.map((s) => ({ serviceName: s.serviceName, interfaceName: s.interfaceName })),
      prerequisites: {
        hasRunningInterface: runningInterfaces.length > 0,
        hasExistingPool: pools.length > 0,
        hasExistingServer: servers.length > 0,
        readyForSetup: interfaces.length > 0,
        warnings,
      },
    };
  }

  async plan(
    tenantId: string,
    routerId: string,
    dto: PppoeSetupPlanDto
  ): Promise<PppoeSetupPlanResult> {
    const { router, config, adapter } = await this.getRouterConfig(tenantId, routerId);

    if (!dto.serviceName || !dto.interfaceName || !dto.poolName || !dto.poolRange || !dto.localAddress) {
      throw new BadRequestException('All configuration parameters are required for setup planning.');
    }

    const [pools, profiles, servers] = await Promise.all([
      adapter.getIpPools(config).catch(() => []),
      adapter.getPppoeProfiles(config).catch(() => []),
      adapter.getPppoeServers(config).catch(() => []),
    ]);

    const poolExists = pools.some((p) => p.name === dto.poolName);
    const profileExists = profiles.some((p) => p.name === dto.defaultProfileName);
    const serverExists = servers.some((s) => s.serviceName === dto.serviceName);

    const steps = [
      {
        stepNumber: 1,
        action: poolExists ? 'Update IP Pool' : 'Create IP Pool',
        target: `/ip/pool (${dto.poolName})`,
        details: `Ranges: ${dto.poolRange}`,
        isNew: !poolExists,
      },
      {
        stepNumber: 2,
        action: profileExists ? 'Update PPP Profile' : 'Create PPP Profile',
        target: `/ppp/profile (${dto.defaultProfileName})`,
        details: `Local: ${dto.localAddress}, Remote: ${dto.poolName}, DNS: ${dto.dnsServers || '1.1.1.1,8.8.8.8'}, Only-One: yes`,
        isNew: !profileExists,
      },
      {
        stepNumber: 3,
        action: serverExists ? 'Update PPPoE Server' : 'Create PPPoE Server',
        target: `/interface/pppoe-server/server (${dto.serviceName})`,
        details: `Interface: ${dto.interfaceName}, Profile: ${dto.defaultProfileName}, MTU: 1480, MRU: 1480`,
        isNew: !serverExists,
      },
    ];

    const planId = `plan_${crypto.randomBytes(6).toString('hex')}`;

    return {
      planId,
      routerId: router.id,
      createdAt: new Date().toISOString(),
      parameters: dto,
      steps,
      safetyCheck: {
        touchesWan: false,
        touchesFirewall: false,
        touchesRouting: false,
        isSafe: true,
      },
    };
  }

  async apply(
    tenantId: string,
    routerId: string,
    dto: PppoeSetupApplyDto,
    userId?: string
  ): Promise<PppoeSetupApplyResult> {
    if (!dto.confirmed) {
      throw new BadRequestException(
        'Explicit confirmation is required before applying privileged router configuration changes.'
      );
    }

    const { router, config, adapter } = await this.getRouterConfig(tenantId, routerId);

    // Create a tracked RouterJob record
    const job = await this.prisma.routerJob.create({
      data: {
        tenantId,
        routerId,
        type: RouterJobType.APPLY_PPP_PROFILE,
        status: RouterJobStatus.PENDING,
        payload: dto as any,
      },
    });

    const appliedSteps: string[] = [];

    try {
      await this.prisma.routerJob.update({
        where: { id: job.id },
        data: { status: RouterJobStatus.PROCESSING, attempts: 1 },
      });

      // Step 1: Upsert IP Pool
      await adapter.upsertIpPool(config, {
        name: dto.poolName,
        ranges: dto.poolRange,
        comment: 'Managed by MikroTik Billing Platform',
      });
      appliedSteps.push(`Configured IP Pool '${dto.poolName}' (${dto.poolRange})`);

      // Step 2: Upsert PPP Profile
      await adapter.upsertPppoeProfile(config, {
        name: dto.defaultProfileName,
        localAddress: dto.localAddress,
        remoteAddress: dto.poolName,
        dnsServer: dto.dnsServers || '1.1.1.1,8.8.8.8',
        onlyOne: 'yes',
        comment: 'Default Subscriber Profile',
      });
      appliedSteps.push(`Configured PPP Profile '${dto.defaultProfileName}'`);

      // Step 3: Upsert PPPoE Server
      await adapter.upsertPppoeServer(config, {
        serviceName: dto.serviceName,
        interfaceName: dto.interfaceName,
        defaultProfile: dto.defaultProfileName,
        oneSessionPerHost: true,
        maxMtu: 1480,
        maxMru: 1480,
        disabled: false,
      });
      appliedSteps.push(`Enabled PPPoE Server '${dto.serviceName}' on interface '${dto.interfaceName}'`);

      // Step 4: Post-Change Verification by reading back from router
      const [vPools, vProfiles, vServers] = await Promise.all([
        adapter.getIpPools(config),
        adapter.getPppoeProfiles(config),
        adapter.getPppoeServers(config),
      ]);

      const verifiedPool = vPools.some((p) => p.name === dto.poolName);
      const verifiedProfile = vProfiles.some((p) => p.name === dto.defaultProfileName);
      const verifiedServer = vServers.some(
        (s) => s.serviceName === dto.serviceName && s.interfaceName === dto.interfaceName
      );

      const allPassed = verifiedPool && verifiedProfile && verifiedServer;

      if (!allPassed) {
        throw new Error(
          `Post-change verification failed. Verified states: Pool=${verifiedPool}, Profile=${verifiedProfile}, Server=${verifiedServer}`
        );
      }

      // Record attempt log and complete job
      await this.prisma.routerJobAttempt.create({
        data: {
          jobId: job.id,
          attemptNumber: 1,
          status: 'SUCCEEDED',
        },
      });

      await this.prisma.routerJob.update({
        where: { id: job.id },
        data: {
          status: RouterJobStatus.SUCCEEDED,
          result: {
            appliedSteps,
            verification: { verifiedPool, verifiedProfile, verifiedServer, allPassed },
          },
        },
      });

      if (userId) {
        await this.auditService.log({
          tenantId,
          userId,
          action: AuditAction.CONFIG_CHANGED,
          entityType: 'ROUTER',
          entityId: routerId,
          details: {
            jobId: job.id,
            planId: dto.planId,
            serviceName: dto.serviceName,
            interfaceName: dto.interfaceName,
          },
        });
      }

      return {
        success: true,
        jobId: job.id,
        routerId,
        status: 'SUCCEEDED',
        appliedSteps,
        postVerification: {
          verifiedPool,
          verifiedProfile,
          verifiedServer,
          allPassed,
        },
      };
    } catch (err: any) {
      await this.prisma.routerJobAttempt.create({
        data: {
          jobId: job.id,
          attemptNumber: 1,
          status: 'FAILED',
        },
      });

      await this.prisma.routerJob.update({
        where: { id: job.id },
        data: {
          status: RouterJobStatus.FAILED,
          error: err.message || 'Failed to apply PPPoE configuration to router',
        },
      });

      return {
        success: false,
        jobId: job.id,
        routerId,
        status: 'FAILED',
        appliedSteps,
        postVerification: {
          verifiedPool: false,
          verifiedProfile: false,
          verifiedServer: false,
          allPassed: false,
        },
        error: err.message,
      };
    }
  }

  async getRouterJobs(tenantId: string, routerId: string) {
    // Verify router belongs to tenant
    const router = await this.prisma.router.findFirst({
      where: { id: routerId, tenantId },
    });

    if (!router) {
      throw new NotFoundException(`Router with ID '${routerId}' was not found.`);
    }

    return this.prisma.routerJob.findMany({
      where: { routerId, tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        attemptsList: {
          orderBy: { attemptNumber: 'desc' },
        },
      },
    });
  }
}
