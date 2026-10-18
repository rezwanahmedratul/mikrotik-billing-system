import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@mikrotik-billing/database';
import {
  SubscriptionStatus,
  BillingCycle,
  AuditAction,
  formatCurrency,
} from '@mikrotik-billing/shared';
import { AuditService } from '../common/audit.service';
import { SubscriptionResponse } from './subscribers.dto';

@Injectable()
export class SubscriptionsService {
  private readonly prisma = prisma;

  constructor(private readonly auditService: AuditService) {}

  mapToResponse(sub: any): SubscriptionResponse {
    const now = new Date();
    const expiry = new Date(sub.expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      id: sub.id,
      packageId: sub.packageId,
      packageName: sub.package?.name || 'Unknown Plan',
      speedLimitRaw: sub.package?.speedLimitRaw || 'N/A',
      priceMinor: sub.package?.priceMinor || 0,
      priceFormatted: formatCurrency(sub.package?.priceMinor || 0),
      billingCycle: (sub.package?.billingCycle as BillingCycle) || BillingCycle.MONTHLY,
      routerId: sub.routerId,
      routerName: sub.router?.name || 'Unknown Router',
      status: sub.status as SubscriptionStatus,
      startDate: sub.startDate.toISOString(),
      expiryDate: sub.expiryDate.toISOString(),
      isAutoRenew: sub.isAutoRenew,
      daysRemaining,
    };
  }

  async createSubscription(
    tenantId: string,
    subscriberId: string,
    data: {
      packageId: string;
      routerId: string;
      startDate?: Date;
      expiryDays?: number;
      isAutoRenew?: boolean;
    },
    userId?: string
  ) {
    const pkg = await this.prisma.package.findFirst({
      where: { id: data.packageId, tenantId },
    });
    if (!pkg) {
      throw new NotFoundException(`Internet package with ID '${data.packageId}' not found.`);
    }

    const router = await this.prisma.router.findFirst({
      where: { id: data.routerId, tenantId },
    });
    if (!router) {
      throw new NotFoundException(`Router gateway with ID '${data.routerId}' not found.`);
    }

    const startDate = data.startDate || new Date();
    const validityDays = data.expiryDays || pkg.validityDays || 30;
    const expiryDate = new Date(startDate.getTime() + validityDays * 24 * 60 * 60 * 1000);

    const subscription = await this.prisma.subscription.create({
      data: {
        tenantId,
        subscriberId,
        packageId: pkg.id,
        routerId: router.id,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        expiryDate,
        isAutoRenew: data.isAutoRenew !== undefined ? data.isAutoRenew : true,
      },
      include: {
        package: true,
        router: true,
      },
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.CONFIG_CHANGED,
        entityType: 'SUBSCRIPTION',
        entityId: subscription.id,
        details: {
          action: 'CREATE_SUBSCRIPTION',
          subscriberId,
          package: pkg.name,
          router: router.name,
          expiryDate: expiryDate.toISOString(),
        },
      });
    }

    return subscription;
  }

  async renewSubscription(
    tenantId: string,
    subscriptionId: string,
    extensionDays?: number,
    userId?: string
  ) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
      include: { package: true, router: true },
    });

    if (!sub) {
      throw new NotFoundException(`Subscription '${subscriptionId}' was not found.`);
    }

    const daysToAdd = extensionDays || sub.package.validityDays || 30;
    const now = new Date();
    const baseDate = sub.expiryDate > now ? sub.expiryDate : now;
    const newExpiryDate = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        expiryDate: newExpiryDate,
        status: SubscriptionStatus.ACTIVE,
        lastBilledAt: now,
      },
      include: { package: true, router: true },
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.CONFIG_CHANGED,
        entityType: 'SUBSCRIPTION',
        entityId: updated.id,
        details: {
          action: 'RENEW_SUBSCRIPTION',
          extendedDays: daysToAdd,
          newExpiryDate: newExpiryDate.toISOString(),
        },
      });
    }

    return this.mapToResponse(updated);
  }

  async changePackage(
    tenantId: string,
    subscriptionId: string,
    newPackageId: string,
    userId?: string
  ) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
    });

    if (!sub) {
      throw new NotFoundException(`Subscription '${subscriptionId}' was not found.`);
    }

    const newPkg = await this.prisma.package.findFirst({
      where: { id: newPackageId, tenantId },
    });

    if (!newPkg) {
      throw new NotFoundException(`Package '${newPackageId}' was not found.`);
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        packageId: newPkg.id,
      },
      include: { package: true, router: true },
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.PACKAGE_UPDATED,
        entityType: 'SUBSCRIPTION',
        entityId: updated.id,
        details: {
          action: 'CHANGE_PACKAGE',
          oldPackageId: sub.packageId,
          newPackageId: newPkg.id,
          newPackageName: newPkg.name,
        },
      });
    }

    return this.mapToResponse(updated);
  }

  async updateStatus(
    tenantId: string,
    subscriptionId: string,
    status: SubscriptionStatus,
    userId?: string
  ) {
    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status },
      include: { package: true, router: true },
    });

    return this.mapToResponse(updated);
  }
}
