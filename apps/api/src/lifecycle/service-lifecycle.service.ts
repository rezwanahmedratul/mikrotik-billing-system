import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@mikrotik-billing/database';
import {
  SubscriptionStatus,
  InvoiceStatus,
  AuditAction,
  SmsTemplateType,
  formatCurrency,
} from '@mikrotik-billing/shared';
import { PppoeProvisioningService } from '../subscribers/pppoe-provisioning.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../common/audit.service';
import {
  RunLifecycleCycleDto,
  LifecycleCycleResult,
  LifecycleActionItem,
  ManualLifecycleOverrideDto,
  ServiceReconciliationReport,
  ServiceDiscrepancyItem,
} from './service-lifecycle.dto';

@Injectable()
export class ServiceLifecycleService {
  private readonly logger = new Logger(ServiceLifecycleService.name);
  private readonly prisma = prisma;

  constructor(
    private readonly provisioningService: PppoeProvisioningService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService
  ) {}

  async executeCycle(
    tenantId: string,
    dto: RunLifecycleCycleDto = {},
    userId?: string
  ): Promise<LifecycleCycleResult> {
    const isDryRun = !!dto.isDryRun;
    const gracePeriodDays = dto.gracePeriodDays ?? 3;
    const targetDate = dto.targetDate ? new Date(dto.targetDate) : new Date();

    const actions: LifecycleActionItem[] = [];
    let subscriptionsSuspended = 0;
    let subscriptionsRestored = 0;
    let dueRemindersSent = 0;

    // -------------------------------------------------------------
    // Phase 1: Automated Restorations (Overdue balances settled)
    // -------------------------------------------------------------
    const suspendedSubscriptions = await this.prisma.subscription.findMany({
      where: {
        tenantId,
        status: SubscriptionStatus.SUSPENDED,
      },
      include: {
        subscriber: {
          include: {
            pppoeAccounts: true,
          },
        },
        package: true,
        router: true,
        invoices: {
          where: {
            status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
            balanceMinor: { gt: 0 },
          },
        },
      },
    });

    for (const sub of suspendedSubscriptions) {
      // If client has zero unpaid overdue invoices, they are cleared for restoration
      if (sub.invoices.length === 0) {
        const pppAccount = sub.subscriber.pppoeAccounts?.[0];
        if (isDryRun) {
          actions.push({
            subscriptionId: sub.id,
            subscriberName: sub.subscriber.fullName,
            subscriberPhone: sub.subscriber.phone,
            accountNumber: sub.subscriber.accountNumber,
            action: 'RESTORE',
            reason: 'All overdue invoices fully paid. Eligible for automatic restoration.',
          });
          subscriptionsRestored++;
        } else {
          // Live Execution
          await this.prisma.subscription.update({
            where: { id: sub.id },
            data: { status: SubscriptionStatus.ACTIVE },
          });

          // Restore on router if router and PPPoE account exist
          if (sub.routerId && pppAccount) {
            await this.provisioningService.restoreAccount(
              sub.routerId,
              pppAccount.username,
              pppAccount.encryptedPassword,
              sub.package.pppProfileName
            );
          }

          // Trigger Service Restored SMS
          await this.notificationsService.sendTemplateSms(
            tenantId,
            {
              recipientPhone: sub.subscriber.phone,
              type: SmsTemplateType.SERVICE_RESTORED,
              variables: {
                name: sub.subscriber.fullName,
              },
            },
            userId
          );

          if (userId) {
            await this.auditService.log({
              tenantId,
              userId,
              action: AuditAction.SERVICE_RESTORED,
              entityType: 'SUBSCRIPTION',
              entityId: sub.id,
              details: {
                subscriber: sub.subscriber.fullName,
                accountNumber: sub.subscriber.accountNumber,
                reason: 'Automated restoration upon invoice settlement',
              },
            });
          }

          actions.push({
            subscriptionId: sub.id,
            subscriberName: sub.subscriber.fullName,
            subscriberPhone: sub.subscriber.phone,
            accountNumber: sub.subscriber.accountNumber,
            action: 'RESTORE',
            reason: 'Service restored and unblocked on router after payment.',
          });
          subscriptionsRestored++;
        }
      }
    }

    // -------------------------------------------------------------
    // Phase 2: Due Date Reminders (with Deduplication)
    // -------------------------------------------------------------
    const reminderHorizon = new Date(targetDate.getTime() + 3 * 86400000); // due within next 3 days
    const upcomingInvoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] },
        balanceMinor: { gt: 0 },
        dueDate: {
          gte: targetDate,
          lte: reminderHorizon,
        },
      },
      include: {
        subscriber: true,
        subscription: true,
      },
    });

    for (const inv of upcomingInvoices) {
      // Deduplication: check if reminder already sent for this invoice in the last 48 hours
      const recentReminder = await this.prisma.notificationJob.findFirst({
        where: {
          tenantId,
          recipientPhone: { contains: inv.subscriber.phone.slice(-8) },
          message: { contains: inv.invoiceNumber },
          createdAt: { gte: new Date(targetDate.getTime() - 48 * 3600000) },
        },
      });

      if (!recentReminder) {
        if (isDryRun) {
          actions.push({
            subscriptionId: inv.subscriptionId || '',
            subscriberName: inv.subscriber.fullName,
            subscriberPhone: inv.subscriber.phone,
            accountNumber: inv.subscriber.accountNumber,
            action: 'REMINDER',
            reason: `Invoice #${inv.invoiceNumber} due on ${inv.dueDate.toLocaleDateString()}. Reminder scheduled.`,
            invoiceId: inv.id,
            balanceFormatted: formatCurrency(inv.balanceMinor),
          });
          dueRemindersSent++;
        } else {
          await this.notificationsService.sendTemplateSms(
            tenantId,
            {
              recipientPhone: inv.subscriber.phone,
              type: SmsTemplateType.DUE_REMINDER,
              variables: {
                name: inv.subscriber.fullName,
                invoiceNumber: inv.invoiceNumber,
                amount: (inv.balanceMinor / 100).toFixed(2),
                dueDate: inv.dueDate.toLocaleDateString(),
              },
            },
            userId
          );

          actions.push({
            subscriptionId: inv.subscriptionId || '',
            subscriberName: inv.subscriber.fullName,
            subscriberPhone: inv.subscriber.phone,
            accountNumber: inv.subscriber.accountNumber,
            action: 'REMINDER',
            reason: `Due reminder sent for Invoice #${inv.invoiceNumber}.`,
            invoiceId: inv.id,
            balanceFormatted: formatCurrency(inv.balanceMinor),
          });
          dueRemindersSent++;
        }
      }
    }

    // -------------------------------------------------------------
    // Phase 3: Automated Suspensions (Overdue beyond grace period)
    // -------------------------------------------------------------
    const cutoffDate = new Date(targetDate.getTime() - gracePeriodDays * 86400000);

    const overdueActiveSubscriptions = await this.prisma.subscription.findMany({
      where: {
        tenantId,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        subscriber: {
          include: {
            pppoeAccounts: true,
          },
        },
        package: true,
        router: true,
        invoices: {
          where: {
            status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
            balanceMinor: { gt: 0 },
            dueDate: { lt: cutoffDate },
          },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    for (const sub of overdueActiveSubscriptions) {
      if (sub.invoices.length > 0) {
        const oldestOverdue = sub.invoices[0];
        const pppAccount = sub.subscriber.pppoeAccounts?.[0];

        if (isDryRun) {
          actions.push({
            subscriptionId: sub.id,
            subscriberName: sub.subscriber.fullName,
            subscriberPhone: sub.subscriber.phone,
            accountNumber: sub.subscriber.accountNumber,
            action: 'SUSPEND',
            reason: `Invoice #${oldestOverdue.invoiceNumber} overdue beyond grace period (${gracePeriodDays} days). Projected suspension.`,
            invoiceId: oldestOverdue.id,
            balanceFormatted: formatCurrency(oldestOverdue.balanceMinor),
          });
          subscriptionsSuspended++;
        } else {
          // 1. Update subscription status in DB
          await this.prisma.subscription.update({
            where: { id: sub.id },
            data: { status: SubscriptionStatus.SUSPENDED },
          });

          // 2. Suspend on router if connected
          if (sub.routerId && pppAccount) {
            await this.provisioningService.suspendAccount(
              sub.routerId,
              pppAccount.username,
              pppAccount.encryptedPassword,
              sub.package.pppProfileName
            );
          }

          // 3. Mark invoice as OVERDUE
          await this.prisma.invoice.update({
            where: { id: oldestOverdue.id },
            data: { status: InvoiceStatus.OVERDUE },
          });

          // 4. Send Service Suspended SMS
          await this.notificationsService.sendTemplateSms(
            tenantId,
            {
              recipientPhone: sub.subscriber.phone,
              type: SmsTemplateType.SERVICE_SUSPENDED,
              variables: {
                name: sub.subscriber.fullName,
                amount: (oldestOverdue.balanceMinor / 100).toFixed(2),
              },
            },
            userId
          );

          if (userId) {
            await this.auditService.log({
              tenantId,
              userId,
              action: AuditAction.SERVICE_SUSPENDED,
              entityType: 'SUBSCRIPTION',
              entityId: sub.id,
              details: {
                subscriber: sub.subscriber.fullName,
                accountNumber: sub.subscriber.accountNumber,
                overdueInvoice: oldestOverdue.invoiceNumber,
                balanceMinor: oldestOverdue.balanceMinor,
                gracePeriodDays,
              },
            });
          }

          actions.push({
            subscriptionId: sub.id,
            subscriberName: sub.subscriber.fullName,
            subscriberPhone: sub.subscriber.phone,
            accountNumber: sub.subscriber.accountNumber,
            action: 'SUSPEND',
            reason: `Suspended due to overdue balance on Invoice #${oldestOverdue.invoiceNumber}.`,
            invoiceId: oldestOverdue.id,
            balanceFormatted: formatCurrency(oldestOverdue.balanceMinor),
          });
          subscriptionsSuspended++;
        }
      }
    }

    return {
      executionDate: targetDate.toISOString(),
      isDryRun,
      dueRemindersSent,
      subscriptionsSuspended,
      subscriptionsRestored,
      actions,
    };
  }

  async manualOverride(
    tenantId: string,
    dto: ManualLifecycleOverrideDto,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: dto.subscriptionId, tenantId },
      include: {
        subscriber: {
          include: {
            pppoeAccounts: true,
          },
        },
        package: true,
      },
    });

    if (!sub) {
      throw new NotFoundException(`Subscription '${dto.subscriptionId}' was not found.`);
    }

    const pppAccount = sub.subscriber.pppoeAccounts?.[0];

    if (dto.action === 'SUSPEND') {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: SubscriptionStatus.SUSPENDED },
      });

      if (sub.routerId && pppAccount) {
        await this.provisioningService.suspendAccount(
          sub.routerId,
          pppAccount.username,
          pppAccount.encryptedPassword,
          sub.package.pppProfileName
        );
      }

      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.SERVICE_SUSPENDED,
        entityType: 'SUBSCRIPTION',
        entityId: sub.id,
        details: {
          subscriber: sub.subscriber.fullName,
          accountNumber: sub.subscriber.accountNumber,
          overrideReason: dto.reason,
        },
      });

      return { success: true, message: `Subscription manually suspended: ${dto.reason}` };
    } else if (dto.action === 'RESTORE') {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: { status: SubscriptionStatus.ACTIVE },
      });

      if (sub.routerId && pppAccount) {
        await this.provisioningService.restoreAccount(
          sub.routerId,
          pppAccount.username,
          pppAccount.encryptedPassword,
          sub.package.pppProfileName
        );
      }

      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.SERVICE_RESTORED,
        entityType: 'SUBSCRIPTION',
        entityId: sub.id,
        details: {
          subscriber: sub.subscriber.fullName,
          accountNumber: sub.subscriber.accountNumber,
          overrideReason: dto.reason,
        },
      });

      return { success: true, message: `Subscription manually restored: ${dto.reason}` };
    } else if (dto.action === 'EXTEND_GRACE') {
      const extensionDays = dto.graceDays || 3;
      const currentExpiry = sub.expiryDate || new Date();
      const newExpiry = new Date(currentExpiry.getTime() + extensionDays * 86400000);

      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          expiryDate: newExpiry,
        },
      });

      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.CONFIG_CHANGED,
        entityType: 'SUBSCRIPTION',
        entityId: sub.id,
        details: {
          subscriber: sub.subscriber.fullName,
          accountNumber: sub.subscriber.accountNumber,
          extensionDays,
          newExpiryDate: newExpiry.toISOString(),
          overrideReason: dto.reason,
        },
      });

      return {
        success: true,
        message: `Grace period extended by ${extensionDays} days until ${newExpiry.toLocaleDateString()}: ${dto.reason}`,
      };
    }

    throw new BadRequestException(`Unsupported lifecycle override action '${dto.action}'.`);
  }

  async reconcileServiceStates(tenantId: string): Promise<ServiceReconciliationReport> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { tenantId },
      include: {
        subscriber: true,
        invoices: {
          where: {
            status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
            balanceMinor: { gt: 0 },
          },
        },
      },
    });

    let activeCount = 0;
    let suspendedCount = 0;
    const discrepancies: ServiceDiscrepancyItem[] = [];

    const now = new Date();

    for (const sub of subscriptions) {
      if (sub.status === SubscriptionStatus.ACTIVE) {
        activeCount++;
        // Check if has severely overdue invoices (> 7 days) while still active
        const overdue = sub.invoices.find((i) => i.dueDate < new Date(now.getTime() - 7 * 86400000));
        if (overdue) {
          discrepancies.push({
            subscriptionId: sub.id,
            subscriber: sub.subscriber.fullName,
            accountNumber: sub.subscriber.accountNumber,
            issue: `Active subscription has overdue invoice #${overdue.invoiceNumber} beyond grace cutoff.`,
            resolution: 'Eligible for suspension in next automated lifecycle cycle.',
          });
        }
      } else if (sub.status === SubscriptionStatus.SUSPENDED) {
        suspendedCount++;
        // Check if suspended despite having 0 overdue balance
        if (sub.invoices.length === 0) {
          discrepancies.push({
            subscriptionId: sub.id,
            subscriber: sub.subscriber.fullName,
            accountNumber: sub.subscriber.accountNumber,
            issue: 'Subscription is marked SUSPENDED but has zero outstanding balance.',
            resolution: 'Eligible for automatic restoration.',
          });
        }
      }
    }

    return {
      reconciledAt: now.toISOString(),
      totalSubscriptions: subscriptions.length,
      activeCount,
      suspendedCount,
      discrepancies,
    };
  }
}
