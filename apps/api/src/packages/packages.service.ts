import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@mikrotik-billing/database';
import {
  BillingCycle,
  AuditAction,
  SpeedLimitSchema,
  parseSpeedStringToKbps,
  formatCurrency,
  parseCurrencyToMinor,
} from '@mikrotik-billing/shared';
import { AuditService } from '../common/audit.service';
import {
  CreatePackageDto,
  UpdatePackageDto,
  PackageResponse,
} from './packages.dto';

@Injectable()
export class PackagesService {
  private readonly prisma = prisma;

  constructor(private readonly auditService: AuditService) {}

  private parseSpeeds(speedLimitRaw: string): { uploadKbps: number; downloadKbps: number } {
    const valid = SpeedLimitSchema.safeParse(speedLimitRaw);
    if (!valid.success) {
      throw new BadRequestException(
        'Invalid speed limit format. Expected format like "10M/10M" or "5120k/10240k" (upload/download).'
      );
    }

    const parts = speedLimitRaw.split('/');
    const uploadKbps = parseSpeedStringToKbps(parts[0]);
    const downloadKbps = parseSpeedStringToKbps(parts[1]);

    if (uploadKbps <= 0 || downloadKbps <= 0) {
      throw new BadRequestException('Upload and download speeds must be greater than zero.');
    }

    return { uploadKbps, downloadKbps };
  }

  private mapToResponse(pkg: any, count = 0): PackageResponse {
    return {
      id: pkg.id,
      tenantId: pkg.tenantId,
      name: pkg.name,
      code: pkg.code,
      downloadSpeedKbps: pkg.downloadSpeedKbps,
      uploadSpeedKbps: pkg.uploadSpeedKbps,
      speedLimitRaw: pkg.speedLimitRaw,
      priceMinor: pkg.priceMinor,
      priceFormatted: formatCurrency(pkg.priceMinor),
      billingCycle: pkg.billingCycle as BillingCycle,
      validityDays: pkg.validityDays,
      pppProfileName: pkg.pppProfileName,
      description: pkg.description,
      isArchived: pkg.isArchived,
      activeSubscriptionsCount: count,
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
    };
  }

  async list(
    tenantId: string,
    options: { includeArchived?: boolean; search?: string } = {}
  ): Promise<PackageResponse[]> {
    const where: any = { tenantId };

    if (!options.includeArchived) {
      where.isArchived = false;
    }

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { code: { contains: options.search, mode: 'insensitive' } },
        { pppProfileName: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const packages = await this.prisma.package.findMany({
      where,
      orderBy: [{ isArchived: 'asc' }, { priceMinor: 'asc' }],
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    return packages.map((p) => this.mapToResponse(p, p._count.subscriptions));
  }

  async getById(tenantId: string, id: string): Promise<PackageResponse> {
    const pkg = await this.prisma.package.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException(`Package with ID '${id}' was not found in your organization.`);
    }

    return this.mapToResponse(pkg, pkg._count.subscriptions);
  }

  async create(tenantId: string, dto: CreatePackageDto, userId?: string): Promise<PackageResponse> {
    if (!dto.name || !dto.speedLimitRaw) {
      throw new BadRequestException('Package name and speed limit format are required.');
    }

    const speeds = this.parseSpeeds(dto.speedLimitRaw);

    let priceMinor = 0;
    if (typeof dto.priceMinor === 'number') {
      priceMinor = Math.round(dto.priceMinor);
    } else if (typeof dto.price === 'number') {
      priceMinor = parseCurrencyToMinor(dto.price);
    }

    if (priceMinor < 0) {
      throw new BadRequestException('Package price cannot be negative.');
    }

    const code =
      dto.code?.trim().toLowerCase() ||
      dto.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const existingCode = await this.prisma.package.findFirst({
      where: { tenantId, code },
    });

    if (existingCode) {
      throw new ConflictException(
        `A package with code '${code}' already exists in your organization.`
      );
    }

    const pppProfileName = dto.pppProfileName?.trim() || dto.name.trim();

    const pkg = await this.prisma.package.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        code,
        downloadSpeedKbps: speeds.downloadKbps,
        uploadSpeedKbps: speeds.uploadKbps,
        speedLimitRaw: dto.speedLimitRaw.trim(),
        priceMinor,
        billingCycle: dto.billingCycle || BillingCycle.MONTHLY,
        validityDays: dto.validityDays || 30,
        pppProfileName,
        description: dto.description?.trim() || null,
        isArchived: false,
      },
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.PACKAGE_CREATED,
        entityType: 'PACKAGE',
        entityId: pkg.id,
        details: {
          name: pkg.name,
          code: pkg.code,
          speed: pkg.speedLimitRaw,
          priceMinor: pkg.priceMinor,
          pppProfileName: pkg.pppProfileName,
        },
      });
    }

    return this.mapToResponse(pkg, 0);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePackageDto,
    userId?: string
  ): Promise<PackageResponse> {
    const existing = await this.prisma.package.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Package with ID '${id}' was not found.`);
    }

    const data: any = {};

    if (dto.name) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.pppProfileName) data.pppProfileName = dto.pppProfileName.trim();
    if (dto.billingCycle) data.billingCycle = dto.billingCycle;
    if (dto.validityDays) data.validityDays = dto.validityDays;
    if (typeof dto.isArchived === 'boolean') data.isArchived = dto.isArchived;

    if (dto.speedLimitRaw) {
      const speeds = this.parseSpeeds(dto.speedLimitRaw);
      data.speedLimitRaw = dto.speedLimitRaw.trim();
      data.downloadSpeedKbps = speeds.downloadKbps;
      data.uploadSpeedKbps = speeds.uploadKbps;
    }

    if (typeof dto.priceMinor === 'number') {
      if (dto.priceMinor < 0) throw new BadRequestException('Price cannot be negative.');
      data.priceMinor = Math.round(dto.priceMinor);
    } else if (typeof dto.price === 'number') {
      if (dto.price < 0) throw new BadRequestException('Price cannot be negative.');
      data.priceMinor = parseCurrencyToMinor(dto.price);
    }

    const updated = await this.prisma.package.update({
      where: { id },
      data,
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.PACKAGE_UPDATED,
        entityType: 'PACKAGE',
        entityId: updated.id,
        details: {
          name: updated.name,
          speed: updated.speedLimitRaw,
          priceMinor: updated.priceMinor,
          propagateToActiveSubscriptions: !!dto.propagateToActiveSubscriptions,
          activeSubscriptionsCount: existing._count.subscriptions,
        },
      });
    }

    return this.mapToResponse(updated, existing._count.subscriptions);
  }

  async archive(tenantId: string, id: string, isArchived: boolean, userId?: string): Promise<PackageResponse> {
    return this.update(tenantId, id, { isArchived }, userId);
  }

  async delete(tenantId: string, id: string, userId?: string): Promise<{ success: boolean }> {
    const pkg = await this.prisma.package.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!pkg) {
      throw new NotFoundException(`Package with ID '${id}' was not found.`);
    }

    if (pkg._count.subscriptions > 0) {
      throw new BadRequestException(
        `Cannot permanently delete package '${pkg.name}' because ${pkg._count.subscriptions} active or historical subscription(s) reference it. Please archive the package instead.`
      );
    }

    await this.prisma.package.delete({
      where: { id },
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.CONFIG_CHANGED,
        entityType: 'PACKAGE',
        entityId: id,
        details: { action: 'DELETE', name: pkg.name },
      });
    }

    return { success: true };
  }
}
