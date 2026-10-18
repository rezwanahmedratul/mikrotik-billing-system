import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@mikrotik-billing/database';
import {
  RouterProtocol,
  RouterConnectionStatus,
  RouterJobStatus,
  encrypt,
} from '@mikrotik-billing/shared';
import { PppoeSetupService } from './pppoe-setup.service.js';
import { RouterAdapterFactory } from './router-adapter.factory.js';
import { AuditService } from '../common/audit.service.js';
import { AuthService } from '../auth/auth.service.js';

describe('PPPoE Guided Setup, Verification & RouterJobs (Section 7)', () => {
  const auditService = new AuditService();
  const authService = new AuthService(auditService);
  const adapterFactory = new RouterAdapterFactory();
  const service = new PppoeSetupService(auditService, adapterFactory);

  let tenant: any;
  let admin: any;
  let router: any;

  beforeAll(async () => {
    const reg = await authService.registerTenant({
      tenantName: 'PPPoE Test ISP',
      tenantCode: `PPPOE_${Date.now()}`,
      adminEmail: `pppoe_admin_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'NOC Engineer',
    });
    tenant = reg.tenant;
    admin = reg.user;

    router = await prisma.router.create({
      data: {
        tenantId: tenant.id,
        name: 'Core-CCR2004-PPPoE',
        host: '192.168.88.1',
        port: 8728,
        protocol: RouterProtocol.REST_HTTPS,
        username: 'admin',
        encryptedPassword: encrypt('ValidPass123!'),
        connectionStatus: RouterConnectionStatus.ONLINE,
      },
    });
  });

  afterAll(async () => {
    if (tenant?.id) {
      await prisma.routerJobAttempt.deleteMany({
        where: { job: { tenantId: tenant.id } },
      });
      await prisma.routerJob.deleteMany({
        where: { tenantId: tenant.id },
      });
      await prisma.router.deleteMany({
        where: { tenantId: tenant.id },
      });
      await prisma.tenant.delete({
        where: { id: tenant.id },
      }).catch(() => {});
    }
  });

  it('performs read-only inspection and checks prerequisites before setup', async () => {
    const inspection = await service.inspect(tenant.id, router.id);

    expect(inspection.routerId).toBe(router.id);
    expect(inspection.isOnline).toBe(true);
    expect(inspection.interfaces.length).toBeGreaterThan(0);
    expect(inspection.prerequisites.hasRunningInterface).toBe(true);
    expect(inspection.prerequisites.readyForSetup).toBe(true);
  });

  it('generates a dry-run setup plan with safety bounds and step diffs', async () => {
    const planDto = {
      serviceName: 'pppoe-in-lan',
      interfaceName: 'ether2-lan',
      poolName: 'pppoe-pool-residential',
      poolRange: '10.10.20.2-10.10.20.254',
      localAddress: '10.10.20.1',
      dnsServers: '1.1.1.1,8.8.8.8',
      defaultProfileName: 'default-residential',
    };

    const plan = await service.plan(tenant.id, router.id, planDto);

    expect(plan.planId).toBeDefined();
    expect(plan.steps.length).toBe(3);
    expect(plan.steps[0].action).toContain('IP Pool');
    expect(plan.steps[1].action).toContain('PPP Profile');
    expect(plan.steps[2].action).toContain('PPPoE Server');

    // Verify strict safety bounds
    expect(plan.safetyCheck.touchesWan).toBe(false);
    expect(plan.safetyCheck.touchesFirewall).toBe(false);
    expect(plan.safetyCheck.touchesRouting).toBe(false);
    expect(plan.safetyCheck.isSafe).toBe(true);
  });

  it('rejects apply request when explicit confirmation is not provided', async () => {
    const applyDto = {
      serviceName: 'pppoe-in-lan',
      interfaceName: 'ether2-lan',
      poolName: 'pppoe-pool-residential',
      poolRange: '10.10.20.2-10.10.20.254',
      localAddress: '10.10.20.1',
      defaultProfileName: 'default-residential',
      confirmed: false, // NOT confirmed
    };

    await expect(
      service.apply(tenant.id, router.id, applyDto, admin.id)
    ).rejects.toThrow('confirmation is required');
  });

  it('applies configuration, performs post-change verification, and logs RouterJob with attempts', async () => {
    const applyDto = {
      serviceName: 'pppoe-in-lan',
      interfaceName: 'ether2-lan',
      poolName: 'pppoe-pool-residential',
      poolRange: '10.10.20.2-10.10.20.254',
      localAddress: '10.10.20.1',
      dnsServers: '1.1.1.1,8.8.8.8',
      defaultProfileName: 'default-residential',
      confirmed: true,
    };

    const result = await service.apply(tenant.id, router.id, applyDto, admin.id);

    expect(result.success).toBe(true);
    expect(result.status).toBe('SUCCEEDED');
    expect(result.postVerification.verifiedPool).toBe(true);
    expect(result.postVerification.verifiedProfile).toBe(true);
    expect(result.postVerification.verifiedServer).toBe(true);
    expect(result.postVerification.allPassed).toBe(true);

    // Verify RouterJob recorded in database
    const job = await prisma.routerJob.findUnique({
      where: { id: result.jobId },
      include: { attemptsList: true },
    });

    expect(job).not.toBeNull();
    expect(job!.status).toBe(RouterJobStatus.SUCCEEDED);
    expect(job!.attempts).toBe(1);
    expect(job!.attemptsList.length).toBe(1);
    expect(job!.attemptsList[0].status).toBe('SUCCEEDED');
  });

  it('guarantees idempotent reapplication of the same configuration without error', async () => {
    const applyDto = {
      serviceName: 'pppoe-in-lan',
      interfaceName: 'ether2-lan',
      poolName: 'pppoe-pool-residential',
      poolRange: '10.10.20.2-10.10.20.254',
      localAddress: '10.10.20.1',
      dnsServers: '1.1.1.1,8.8.8.8',
      defaultProfileName: 'default-residential',
      confirmed: true,
    };

    // Second execution with identical desired state
    const rerun = await service.apply(tenant.id, router.id, applyDto, admin.id);
    expect(rerun.success).toBe(true);
    expect(rerun.postVerification.allPassed).toBe(true);

    // Verify router jobs can be queried
    const jobs = await service.getRouterJobs(tenant.id, router.id);
    expect(jobs.length).toBeGreaterThanOrEqual(2);
  });
});
