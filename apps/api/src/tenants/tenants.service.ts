import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import argon2 from 'argon2';
import { prisma } from '@mikrotik-billing/database';
import { UserRole, AuditAction } from '@mikrotik-billing/shared';
import {
  CreateStaffDto,
  UpdateStaffDto,
  UpdateTenantSettingsDto,
  CreateStaffSchema,
  UpdateStaffSchema,
  UpdateTenantSettingsSchema,
} from './tenants.dto.js';
import { AuditService } from '../common/audit.service.js';

@Injectable()
export class TenantsService {
  constructor(private readonly auditService: AuditService) {}

  async getCurrentTenant(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            memberships: true,
            routers: { where: { isArchived: false } },
            subscribers: { where: { isArchived: false } },
            packages: { where: { isArchived: false } },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant organization not found');
    }

    return tenant;
  }

  async updateTenantSettings(tenantId: string, dto: UpdateTenantSettingsDto, userId: string) {
    const parseResult = UpdateTenantSettingsSchema.safeParse(dto);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0]?.message);
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: parseResult.data,
    });

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.CONFIG_CHANGED,
      entityType: 'Tenant',
      entityId: tenantId,
      details: parseResult.data as Record<string, unknown>,
    });

    return updated;
  }

  async listStaff(tenantId: string) {
    const memberships = await prisma.tenantMembership.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      email: m.user.email,
      fullName: m.user.fullName,
      phone: m.user.phone,
      role: m.role as unknown as UserRole,
      isActive: m.isActive && m.user.isActive,
      joinedAt: m.createdAt,
    }));
  }

  async createStaff(tenantId: string, dto: CreateStaffDto, creatorUserId: string) {
    const parseResult = CreateStaffSchema.safeParse(dto);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0]?.message);
    }

    const { email, fullName, role, password, phone } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if membership already exists for this tenant
    const existingMembership = await prisma.tenantMembership.findFirst({
      where: {
        tenantId,
        user: { email: normalizedEmail },
      },
    });

    if (existingMembership) {
      throw new BadRequestException(
        'A staff member with this email already belongs to this organization.'
      );
    }

    const passwordHash = await argon2.hash(password);

    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: normalizedEmail,
            fullName: fullName.trim(),
            passwordHash,
            phone,
          },
        });
      }

      const membership = await tx.tenantMembership.create({
        data: {
          tenantId,
          userId: user.id,
          role: role as any,
          isActive: true,
        },
        include: { user: true },
      });

      return membership;
    });

    await this.auditService.log({
      tenantId,
      userId: creatorUserId,
      action: AuditAction.CONFIG_CHANGED,
      entityType: 'TenantMembership',
      entityId: result.id,
      details: { addedUserEmail: result.user.email, role: result.role },
    });

    return {
      membershipId: result.id,
      userId: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.role as unknown as UserRole,
      isActive: result.isActive,
    };
  }

  async updateStaff(
    tenantId: string,
    membershipId: string,
    dto: UpdateStaffDto,
    updaterUserId: string
  ) {
    const parseResult = UpdateStaffSchema.safeParse(dto);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0]?.message);
    }

    const membership = await prisma.tenantMembership.findUnique({
      where: { id: membershipId },
    });

    // Enforce tenant boundary: cannot modify membership of another tenant
    if (!membership || membership.tenantId !== tenantId) {
      throw new NotFoundException('Staff member not found in this organization');
    }

    // Protect last ISP_ADMIN from demotion or deactivation
    if (
      (membership.role as unknown as UserRole) === UserRole.ISP_ADMIN &&
      (dto.role || dto.isActive === false)
    ) {
      const adminCount = await prisma.tenantMembership.count({
        where: {
          tenantId,
          role: UserRole.ISP_ADMIN as any,
          isActive: true,
        },
      });

      if (adminCount <= 1 && (dto.role !== UserRole.ISP_ADMIN || dto.isActive === false)) {
        throw new ForbiddenException(
          'Cannot demote or deactivate the only remaining organization administrator.'
        );
      }
    }

    const updated = await prisma.tenantMembership.update({
      where: { id: membershipId },
      data: parseResult.data as any,
      include: { user: true },
    });

    await this.auditService.log({
      tenantId,
      userId: updaterUserId,
      action: AuditAction.CONFIG_CHANGED,
      entityType: 'TenantMembership',
      entityId: membershipId,
      details: { changes: parseResult.data, targetUserEmail: updated.user.email },
    });

    return {
      membershipId: updated.id,
      userId: updated.user.id,
      email: updated.user.email,
      fullName: updated.user.fullName,
      role: updated.role as unknown as UserRole,
      isActive: updated.isActive,
    };
  }

  async removeStaff(tenantId: string, membershipId: string, removerUserId: string) {
    const membership = await prisma.tenantMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership || membership.tenantId !== tenantId) {
      throw new NotFoundException('Staff member not found in this organization');
    }

    if (membership.userId === removerUserId) {
      throw new ForbiddenException('You cannot remove your own administrator membership.');
    }

    if ((membership.role as unknown as UserRole) === UserRole.ISP_ADMIN) {
      const adminCount = await prisma.tenantMembership.count({
        where: { tenantId, role: UserRole.ISP_ADMIN as any, isActive: true },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException(
          'Cannot remove the only remaining organization administrator.'
        );
      }
    }

    await prisma.tenantMembership.delete({
      where: { id: membershipId },
    });

    await this.auditService.log({
      tenantId,
      userId: removerUserId,
      action: AuditAction.CONFIG_CHANGED,
      entityType: 'TenantMembership',
      entityId: membershipId,
      details: { action: 'REMOVED_STAFF_MEMBERSHIP' },
    });

    return { success: true, message: 'Staff member removed from organization.' };
  }
}
