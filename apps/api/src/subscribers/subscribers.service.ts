import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import crypto from 'node:crypto';
import { prisma } from '@mikrotik-billing/database';
import {
  SubscriptionStatus,
  AuditAction,
  encrypt,
  decrypt,
  formatCurrency,
} from '@mikrotik-billing/shared';
import { AuditService } from '../common/audit.service';
import { PppoeProvisioningService } from './pppoe-provisioning.service';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriberDto,
  UpdateSubscriberDto,
  ChangeServiceStatusDto,
  SubscriberQueryDto,
  SubscriberResponse,
  SubscriberDetailResponse,
  PaginatedSubscribersResponse,
} from './subscribers.dto';

@Injectable()
export class SubscribersService {
  private readonly prisma = prisma;

  constructor(
    private readonly auditService: AuditService,
    private readonly provisioningService: PppoeProvisioningService,
    private readonly subscriptionsService: SubscriptionsService
  ) {}

  private async generateAccountNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.subscriber.count({ where: { tenantId } });
    const padded = String(count + 1).padStart(4, '0');
    return `SUB-${padded}`;
  }

  private mapSubscriber(sub: any): SubscriberResponse {
    const primarySub = sub.subscriptions?.[0] || null;
    const pppoe = sub.pppoeAccounts?.[0] || null;

    return {
      id: sub.id,
      tenantId: sub.tenantId,
      accountNumber: sub.accountNumber,
      fullName: sub.fullName,
      phone: sub.phone,
      email: sub.email,
      nidOrPassport: sub.nidOrPassport,
      address: sub.address,
      billingAddress: sub.billingAddress,
      isArchived: sub.isArchived,
      createdAt: sub.createdAt.toISOString(),
      updatedAt: sub.updatedAt.toISOString(),
      currentSubscription: primarySub
        ? this.subscriptionsService.mapToResponse(primarySub)
        : null,
      pppoeAccount: pppoe
        ? {
            id: pppoe.id,
            routerId: pppoe.routerId,
            routerName: pppoe.router?.name || 'Router Gateway',
            username: pppoe.username,
            hasPassword: true, // Never return raw password
            pppProfile: pppoe.pppProfile,
            staticIp: pppoe.staticIp,
            callerId: pppoe.callerId,
            isSuspended: pppoe.isSuspended,
            confirmedOnRouter: true,
            lastProvisionedAt: pppoe.updatedAt?.toISOString() || null,
          }
        : null,
    };
  }

  async list(tenantId: string, query: SubscriberQueryDto = {}): Promise<PaginatedSubscribersResponse> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (!query.isArchived) {
      where.isArchived = false;
    }

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { accountNumber: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { pppoeAccounts: { some: { username: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    if (query.status) {
      where.subscriptions = {
        some: { status: query.status },
      };
    }

    if (query.routerId) {
      where.subscriptions = {
        ...where.subscriptions,
        some: { ...(where.subscriptions?.some || {}), routerId: query.routerId },
      };
    }

    if (query.packageId) {
      where.subscriptions = {
        ...where.subscriptions,
        some: { ...(where.subscriptions?.some || {}), packageId: query.packageId },
      };
    }

    const [total, subscribers] = await Promise.all([
      this.prisma.subscriber.count({ where }),
      this.prisma.subscriber.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subscriptions: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { package: true, router: true },
          },
          pppoeAccounts: {
            take: 1,
            include: { router: true },
          },
        },
      }),
    ]);

    return {
      data: subscribers.map((s) => this.mapSubscriber(s)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<SubscriberDetailResponse> {
    const subscriber = await this.prisma.subscriber.findFirst({
      where: { id, tenantId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          include: { package: true, router: true },
        },
        pppoeAccounts: {
          include: { router: true },
        },
        serviceEvents: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        invoices: {
          select: { id: true, balanceMinor: true },
        },
        payments: {
          select: { id: true },
        },
      },
    });

    if (!subscriber) {
      throw new NotFoundException(`Subscriber with ID '${id}' was not found.`);
    }

    const outstandingBalanceMinor = subscriber.invoices.reduce(
      (acc, inv) => acc + (inv.balanceMinor || 0),
      0
    );

    const base = this.mapSubscriber(subscriber);

    return {
      ...base,
      subscriptions: subscriber.subscriptions.map((s) =>
        this.subscriptionsService.mapToResponse(s)
      ),
      serviceEvents: subscriber.serviceEvents.map((e) => ({
        id: e.id,
        type: e.type,
        reason: e.reason,
        initiatedBy: e.initiatedBy,
        createdAt: e.createdAt.toISOString(),
      })),
      invoicesCount: subscriber.invoices.length,
      paymentsCount: subscriber.payments.length,
      outstandingBalanceMinor,
    };
  }

  async create(tenantId: string, dto: CreateSubscriberDto, userId?: string): Promise<SubscriberResponse> {
    if (!dto.fullName?.trim() || !dto.phone?.trim()) {
      throw new BadRequestException('Subscriber full name and contact phone number are required.');
    }
    if (!dto.packageId || !dto.routerId) {
      throw new BadRequestException('Package and Router gateway assignments are required.');
    }

    const router = await this.prisma.router.findFirst({
      where: { id: dto.routerId, tenantId },
    });
    if (!router) {
      throw new NotFoundException(`Router '${dto.routerId}' was not found in your organization.`);
    }

    const pkg = await this.prisma.package.findFirst({
      where: { id: dto.packageId, tenantId },
    });
    if (!pkg) {
      throw new NotFoundException(`Package '${dto.packageId}' was not found in your organization.`);
    }

    const accountNumber = await this.generateAccountNumber(tenantId);

    // Generate or format PPPoE username
    const username = (
      dto.pppoeUsername?.trim() ||
      `${dto.fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}_${accountNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}`
    ).toLowerCase();

    // Enforce tenant-scoped username uniqueness
    const existingPppoe = await this.prisma.pppoeAccount.findFirst({
      where: { tenantId, username },
    });
    if (existingPppoe) {
      throw new ConflictException(
        `PPPoE username '${username}' already exists in your organization. Please choose a unique username.`
      );
    }

    // Generate password if not supplied
    const rawPassword = dto.pppoePassword?.trim() || crypto.randomBytes(6).toString('hex');
    const encryptedPassword = encrypt(rawPassword);

    // 1. Create Subscriber
    const subscriber = await this.prisma.subscriber.create({
      data: {
        tenantId,
        accountNumber,
        fullName: dto.fullName.trim(),
        phone: dto.phone.trim(),
        email: dto.email?.trim() || null,
        nidOrPassport: dto.nidOrPassport?.trim() || null,
        address: dto.address?.trim() || null,
        billingAddress: dto.billingAddress?.trim() || null,
        isArchived: false,
      },
    });

    // 2. Create Initial Subscription
    const subscription = await this.subscriptionsService.createSubscription(
      tenantId,
      subscriber.id,
      {
        packageId: pkg.id,
        routerId: router.id,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        expiryDays: dto.expiryDays || pkg.validityDays,
        isAutoRenew: dto.isAutoRenew,
      },
      userId
    );

    // 3. Provision PPPoE credentials to Router Gateway
    const provisionResult = await this.provisioningService.provisionToRouter(router.id, {
      username,
      password: rawPassword,
      pppProfile: pkg.pppProfileName,
      staticIp: dto.staticIp?.trim() || null,
      callerId: dto.callerId?.trim() || null,
      disabled: false,
      comment: `Subscriber: ${subscriber.fullName} (${subscriber.accountNumber})`,
    });

    if (!provisionResult.success) {
      // Record failure warning but do not rollback subscriber creation so operators can retry
      await this.prisma.serviceEvent.create({
        data: {
          tenantId,
          subscriberId: subscriber.id,
          type: 'PROVISIONING_FAILED',
          reason: provisionResult.error || 'Initial hardware sync failed',
          initiatedBy: userId,
        },
      });
    }

    // 4. Save PPPoE account record
    const pppoeAccount = await this.prisma.pppoeAccount.create({
      data: {
        tenantId,
        subscriberId: subscriber.id,
        routerId: router.id,
        username,
        encryptedPassword,
        pppProfile: pkg.pppProfileName,
        staticIp: dto.staticIp?.trim() || null,
        callerId: dto.callerId?.trim() || null,
        isSuspended: false,
      },
      include: { router: true },
    });

    // 5. Audit Logging
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.SUBSCRIBER_CREATED,
        entityType: 'SUBSCRIBER',
        entityId: subscriber.id,
        details: {
          accountNumber,
          fullName: subscriber.fullName,
          phone: subscriber.phone,
          package: pkg.name,
          router: router.name,
          pppoeUsername: username,
          provisionedOnRouter: provisionResult.success,
        },
      });
    }

    return {
      id: subscriber.id,
      tenantId: subscriber.tenantId,
      accountNumber: subscriber.accountNumber,
      fullName: subscriber.fullName,
      phone: subscriber.phone,
      email: subscriber.email,
      nidOrPassport: subscriber.nidOrPassport,
      address: subscriber.address,
      billingAddress: subscriber.billingAddress,
      isArchived: subscriber.isArchived,
      createdAt: subscriber.createdAt.toISOString(),
      updatedAt: subscriber.updatedAt.toISOString(),
      currentSubscription: this.subscriptionsService.mapToResponse(subscription),
      pppoeAccount: {
        id: pppoeAccount.id,
        routerId: pppoeAccount.routerId,
        routerName: router.name,
        username: pppoeAccount.username,
        hasPassword: true,
        pppProfile: pppoeAccount.pppProfile,
        staticIp: pppoeAccount.staticIp,
        callerId: pppoeAccount.callerId,
        isSuspended: false,
        confirmedOnRouter: provisionResult.success,
        lastProvisionedAt: new Date().toISOString(),
      },
    };
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateSubscriberDto,
    userId?: string
  ): Promise<SubscriberResponse> {
    const existing = await this.prisma.subscriber.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException(`Subscriber with ID '${id}' was not found.`);
    }

    const data: any = {};
    if (dto.fullName) data.fullName = dto.fullName.trim();
    if (dto.phone) data.phone = dto.phone.trim();
    if (dto.email !== undefined) data.email = dto.email?.trim() || null;
    if (dto.nidOrPassport !== undefined) data.nidOrPassport = dto.nidOrPassport?.trim() || null;
    if (dto.address !== undefined) data.address = dto.address?.trim() || null;
    if (dto.billingAddress !== undefined) data.billingAddress = dto.billingAddress?.trim() || null;

    const updated = await this.prisma.subscriber.update({
      where: { id },
      data,
      include: {
        subscriptions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { package: true, router: true },
        },
        pppoeAccounts: {
          take: 1,
          include: { router: true },
        },
      },
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.SUBSCRIBER_UPDATED,
        entityType: 'SUBSCRIBER',
        entityId: updated.id,
        details: { fields: Object.keys(data) },
      });
    }

    return this.mapSubscriber(updated);
  }

  async changeServiceStatus(
    tenantId: string,
    subscriberId: string,
    dto: ChangeServiceStatusDto,
    userId?: string
  ): Promise<SubscriberDetailResponse> {
    const subscriber = await this.prisma.subscriber.findFirst({
      where: { id: subscriberId, tenantId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { package: true, router: true },
        },
        pppoeAccounts: {
          take: 1,
          include: { router: true },
        },
      },
    });

    if (!subscriber) {
      throw new NotFoundException(`Subscriber '${subscriberId}' was not found.`);
    }

    const primarySub = subscriber.subscriptions[0];
    const pppoe = subscriber.pppoeAccounts[0];

    const isSuspending = dto.status === 'SUSPENDED';

    // 1. Update Subscription Status
    if (primarySub) {
      await this.prisma.subscription.update({
        where: { id: primarySub.id },
        data: {
          status: isSuspending ? SubscriptionStatus.SUSPENDED : SubscriptionStatus.ACTIVE,
        },
      });
    }

    // 2. Update Router Hardware State & PPPoE Account
    if (pppoe) {
      await this.prisma.pppoeAccount.update({
        where: { id: pppoe.id },
        data: { isSuspended: isSuspending },
      });

      if (isSuspending) {
        await this.provisioningService.suspendAccount(
          pppoe.routerId,
          pppoe.username,
          pppoe.encryptedPassword,
          pppoe.pppProfile
        );
      } else {
        await this.provisioningService.restoreAccount(
          pppoe.routerId,
          pppoe.username,
          pppoe.encryptedPassword,
          pppoe.pppProfile
        );
      }
    }

    // 3. Record Service Event History
    await this.prisma.serviceEvent.create({
      data: {
        tenantId,
        subscriberId,
        type: isSuspending ? 'SUSPENDED' : 'RESTORED',
        reason: dto.reason || (isSuspending ? 'Manual operator suspension' : 'Service restoration'),
        initiatedBy: userId,
      },
    });

    // 4. Audit Log
    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: isSuspending ? AuditAction.SERVICE_SUSPENDED : AuditAction.SERVICE_RESTORED,
        entityType: 'SUBSCRIBER',
        entityId: subscriberId,
        details: {
          reason: dto.reason,
          pppoeUsername: pppoe?.username,
          router: pppoe?.router?.name,
        },
      });
    }

    return this.getById(tenantId, subscriberId);
  }

  async reprovision(tenantId: string, subscriberId: string, userId?: string) {
    const subscriber = await this.prisma.subscriber.findFirst({
      where: { id: subscriberId, tenantId },
      include: {
        pppoeAccounts: { take: 1, include: { router: true } },
      },
    });

    if (!subscriber || !subscriber.pppoeAccounts[0]) {
      throw new NotFoundException(`Subscriber or PPPoE account not found.`);
    }

    const pppoe = subscriber.pppoeAccounts[0];
    const plainPassword = decrypt(pppoe.encryptedPassword);

    const result = await this.provisioningService.provisionToRouter(pppoe.routerId, {
      username: pppoe.username,
      password: plainPassword,
      pppProfile: pppoe.pppProfile,
      staticIp: pppoe.staticIp,
      callerId: pppoe.callerId,
      disabled: pppoe.isSuspended,
      comment: `Subscriber: ${subscriber.fullName} (Reprovisioned)`,
    });

    if (!result.success) {
      throw new BadRequestException(`Reprovisioning failed: ${result.error}`);
    }

    await this.prisma.serviceEvent.create({
      data: {
        tenantId,
        subscriberId,
        type: 'REPROVISIONED',
        reason: 'Manual hardware synchronization completed successfully',
        initiatedBy: userId,
      },
    });

    return { success: true };
  }

  async archive(tenantId: string, id: string, isArchived: boolean, userId?: string): Promise<SubscriberResponse> {
    const subscriber = await this.prisma.subscriber.findFirst({
      where: { id, tenantId },
    });
    if (!subscriber) {
      throw new NotFoundException(`Subscriber with ID '${id}' was not found.`);
    }

    const updated = await this.prisma.subscriber.update({
      where: { id },
      data: { isArchived },
      include: {
        subscriptions: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { package: true, router: true },
        },
        pppoeAccounts: {
          take: 1,
          include: { router: true },
        },
      },
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.CONFIG_CHANGED,
        entityType: 'SUBSCRIBER',
        entityId: id,
        details: { action: isArchived ? 'ARCHIVE' : 'RESTORE' },
      });
    }

    return this.mapSubscriber(updated);
  }
}
