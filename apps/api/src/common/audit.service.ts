import { Injectable } from '@nestjs/common';
import { prisma, Prisma } from '@mikrotik-billing/database';
import { AuditAction } from '@mikrotik-billing/shared';

export interface CreateAuditLogParams {
  tenantId: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  async log(params: CreateAuditLogParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: params.tenantId,
          userId: params.userId,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          details: (params.details ?? {}) as Prisma.InputJsonValue,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (err: any) {
      console.error('[AuditService] Failed to record audit log:', err.message);
    }
  }
}
