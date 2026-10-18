import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '@mikrotik-billing/database';
import { UserRole, TenantStatus, AuditAction, SmsTemplateType } from '@mikrotik-billing/shared';
import { LoginDto, RegisterTenantDto, LoginSchema, RegisterTenantSchema } from './auth.dto.js';
import { AuditService } from '../common/audit.service.js';
import { JwtPayload } from '../common/auth-user.interface.js';

interface RateLimitTracker {
  attempts: number;
  blockedUntil?: number;
}

@Injectable()
export class AuthService {
  private loginAttempts = new Map<string, RateLimitTracker>();

  constructor(private readonly auditService: AuditService) {}

  private checkLoginRateLimit(identifier: string) {
    const record = this.loginAttempts.get(identifier);
    if (!record) return;

    const now = Date.now();
    if (record.blockedUntil && record.blockedUntil > now) {
      const waitMinutes = Math.ceil((record.blockedUntil - now) / 60000);
      throw new ForbiddenException(
        `Too many consecutive failed login attempts. Account temporarily locked. Please try again in ${waitMinutes} minute(s).`
      );
    }
  }

  private registerFailedAttempt(identifier: string) {
    const record = this.loginAttempts.get(identifier) || { attempts: 0 };
    record.attempts += 1;
    if (record.attempts >= 5) {
      // Lock for 5 minutes
      record.blockedUntil = Date.now() + 5 * 60 * 1000;
    }
    this.loginAttempts.set(identifier, record);
  }

  private clearFailedAttempts(identifier: string) {
    this.loginAttempts.delete(identifier);
  }

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string) {
    const parseResult = LoginSchema.safeParse(dto);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0]?.message);
    }

    const { email, password, tenantId } = parseResult.data;
    const rateLimitKey = `${email.toLowerCase()}_${ipAddress || 'unknown'}`;
    this.checkLoginRateLimit(rateLimitKey);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        memberships: {
          where: { isActive: true },
          include: { tenant: true },
        },
      },
    });

    if (!user || !user.isActive) {
      this.registerFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      this.registerFailedAttempt(rateLimitKey);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.clearFailedAttempts(rateLimitKey);

    // Determine tenant membership
    let activeMembership = user.memberships[0];

    if (tenantId) {
      const matched = user.memberships.find(
        (m) => m.tenantId === tenantId || m.tenant.code.toUpperCase() === tenantId.toUpperCase()
      );
      if (matched) {
        activeMembership = matched;
      }
    }

    // Platform admin without tenant membership
    let role: UserRole = UserRole.AUDITOR;
    let selectedTenantId = '';
    let tenantName = 'Platform Admin Console';

    if (activeMembership) {
      if (activeMembership.tenant.status === (TenantStatus.SUSPENDED as any)) {
        throw new ForbiddenException('This ISP organization account is currently suspended.');
      }
      role = activeMembership.role as unknown as UserRole;
      selectedTenantId = activeMembership.tenantId;
      tenantName = activeMembership.tenant.name;
    } else {
      // Check if user is platform admin
      const isPlatformAdmin = user.email.includes('platform.admin');
      if (isPlatformAdmin) {
        role = UserRole.PLATFORM_ADMIN;
        selectedTenantId = 'platform';
      } else {
        throw new ForbiddenException('No active organization membership assigned to your account.');
      }
    }

    const jwtSecret =
      process.env.JWT_SECRET || 'super_secret_jwt_key_for_development_purposes_only';

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      tenantId: selectedTenantId,
      role,
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

    // Record login audit event
    await this.auditService.log({
      tenantId: selectedTenantId || 'platform',
      userId: user.id,
      action: AuditAction.USER_LOGIN,
      entityType: 'User',
      entityId: user.id,
      details: { email: user.email, role },
      ipAddress,
      userAgent,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role,
      },
      tenant: {
        id: selectedTenantId,
        name: tenantName,
      },
    };
  }

  async registerTenant(dto: RegisterTenantDto, ipAddress?: string, userAgent?: string) {
    const parseResult = RegisterTenantSchema.safeParse(dto);
    if (!parseResult.success) {
      throw new BadRequestException(parseResult.error.errors[0]?.message);
    }

    const { tenantName, tenantCode, adminEmail, adminPassword, adminFullName, contactPhone } =
      parseResult.data;

    const normalizedCode = tenantCode.toUpperCase().trim();
    const normalizedEmail = adminEmail.toLowerCase().trim();

    // Check if code or email already in use
    const existingTenant = await prisma.tenant.findUnique({
      where: { code: normalizedCode },
    });
    if (existingTenant) {
      throw new BadRequestException(`Organization code '${normalizedCode}' is already taken.`);
    }

    const passwordHash = await argon2.hash(adminPassword);

    // Create Tenant and Admin in transaction
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName.trim(),
          code: normalizedCode,
          contactEmail: normalizedEmail,
          contactPhone,
          status: TenantStatus.ACTIVE,
        },
      });

      let user = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: normalizedEmail,
            fullName: adminFullName.trim(),
            passwordHash,
            phone: contactPhone,
          },
        });
      }

      await tx.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: UserRole.ISP_ADMIN,
        },
      });

      // Default Notification Templates
      await tx.notificationTemplate.createMany({
        data: [
          {
            tenantId: tenant.id,
            type: SmsTemplateType.INVOICE_ISSUED,
            name: 'Invoice Notice',
            templateText:
              'Dear {{subscriberName}}, invoice #{{invoiceNumber}} of BDT {{amount}} is due on {{dueDate}}.',
          },
          {
            tenantId: tenant.id,
            type: SmsTemplateType.PAYMENT_RECEIVED,
            name: 'Payment Receipt',
            templateText:
              'Dear {{subscriberName}}, payment of BDT {{amount}} received (Ref: {{paymentNumber}}). Thank you.',
          },
        ],
      });

      return { tenant, user };
    });

    // Sign JWT
    const jwtSecret =
      process.env.JWT_SECRET || 'super_secret_jwt_key_for_development_purposes_only';
    const payload: JwtPayload = {
      sub: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
      tenantId: result.tenant.id,
      role: UserRole.ISP_ADMIN,
    };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

    await this.auditService.log({
      tenantId: result.tenant.id,
      userId: result.user.id,
      action: AuditAction.CONFIG_CHANGED,
      entityType: 'Tenant',
      entityId: result.tenant.id,
      details: { name: result.tenant.name, code: result.tenant.code },
      ipAddress,
      userAgent,
    });

    return {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.fullName,
        role: UserRole.ISP_ADMIN,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        code: result.tenant.code,
      },
    };
  }

  async getMe(userId: string, tenantId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        isActive: true,
        memberships: {
          where: { isActive: true },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                code: true,
                currency: true,
                timezone: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const currentMembership = user.memberships.find((m) => m.tenantId === tenantId);
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: (currentMembership?.role as unknown as UserRole) ?? UserRole.AUDITOR,
      },
      tenant: currentMembership?.tenant ?? null,
      availableTenants: user.memberships.map((m) => ({
        tenantId: m.tenantId,
        name: m.tenant.name,
        code: m.tenant.code,
        role: m.role as unknown as UserRole,
      })),
    };
  }

  async logout(userId: string, tenantId: string, ipAddress?: string) {
    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.USER_LOGOUT,
      entityType: 'User',
      entityId: userId,
      ipAddress,
    });
    return { success: true, message: 'Logged out successfully' };
  }
}
