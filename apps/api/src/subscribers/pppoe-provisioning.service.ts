import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { prisma } from '@mikrotik-billing/database';
import {
  decrypt,
  RouterAdapter,
  RouterConnectionConfig,
} from '@mikrotik-billing/shared';
import { RouterAdapterFactory } from '../routers/router-adapter.factory';

@Injectable()
export class PppoeProvisioningService {
  private readonly logger = new Logger(PppoeProvisioningService.name);
  private readonly prisma = prisma;

  constructor(private readonly adapterFactory: RouterAdapterFactory) {}

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

  async provisionToRouter(
    routerId: string,
    secret: {
      username: string;
      password: string;
      pppProfile: string;
      disabled?: boolean;
      staticIp?: string | null;
      callerId?: string | null;
      comment?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    const router = await this.prisma.router.findUnique({
      where: { id: routerId },
    });

    if (!router) {
      throw new BadRequestException(`Router gateway with ID '${routerId}' was not found.`);
    }

    try {
      const config = this.getRouterConfig(router);
      const adapter: RouterAdapter = this.adapterFactory.getAdapter(config);

      await adapter.upsertPppoeSecret(config, {
        name: secret.username,
        password: secret.password,
        profile: secret.pppProfile,
        disabled: !!secret.disabled,
        remoteAddress: secret.staticIp || undefined,
        callerId: secret.callerId || undefined,
        comment: secret.comment || `Managed by MikroTik Billing Platform`,
      });

      return { success: true };
    } catch (err: any) {
      this.logger.error(
        `Failed to provision PPPoE secret '${secret.username}' to router '${router.name}': ${err.message}`
      );
      return { success: false, error: err.message };
    }
  }

  async suspendAccount(
    routerId: string,
    username: string,
    encryptedPassword: string,
    pppProfile: string
  ): Promise<{ success: boolean; error?: string }> {
    const router = await this.prisma.router.findUnique({
      where: { id: routerId },
    });

    if (!router) {
      return { success: false, error: 'Router not found' };
    }

    try {
      const config = this.getRouterConfig(router);
      const adapter = this.adapterFactory.getAdapter(config);
      const plainPassword = decrypt(encryptedPassword);

      // Disable secret on router
      await adapter.upsertPppoeSecret(config, {
        name: username,
        password: plainPassword,
        profile: pppProfile,
        disabled: true,
        comment: 'Suspended by Billing Platform',
      });

      // Disconnect active session to apply cutoff immediately
      await adapter.disconnectSession(config, username).catch((err) => {
        this.logger.warn(`Could not disconnect active session for ${username}: ${err.message}`);
      });

      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to suspend account ${username} on router: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async restoreAccount(
    routerId: string,
    username: string,
    encryptedPassword: string,
    pppProfile: string
  ): Promise<{ success: boolean; error?: string }> {
    const router = await this.prisma.router.findUnique({
      where: { id: routerId },
    });

    if (!router) {
      return { success: false, error: 'Router not found' };
    }

    try {
      const config = this.getRouterConfig(router);
      const adapter = this.adapterFactory.getAdapter(config);
      const plainPassword = decrypt(encryptedPassword);

      // Enable secret on router
      await adapter.upsertPppoeSecret(config, {
        name: username,
        password: plainPassword,
        profile: pppProfile,
        disabled: false,
        comment: 'Active subscriber - Managed by Billing Platform',
      });

      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to restore account ${username} on router: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async removeAccount(
    routerId: string,
    username: string
  ): Promise<{ success: boolean; error?: string }> {
    const router = await this.prisma.router.findUnique({
      where: { id: routerId },
    });

    if (!router) return { success: true };

    try {
      const config = this.getRouterConfig(router);
      const adapter = this.adapterFactory.getAdapter(config);

      await adapter.disconnectSession(config, username).catch(() => {});
      await adapter.deletePppoeSecret(config, username).catch(() => {});
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
