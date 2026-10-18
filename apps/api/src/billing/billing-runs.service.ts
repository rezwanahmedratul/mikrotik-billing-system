import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@mikrotik-billing/database';
import {
  formatCurrency,
  AuditAction,
} from '@mikrotik-billing/shared';
import { AuditService } from '../common/audit.service';
import { InvoicesService } from './invoices.service';
import { BillingRunDto, BillingRunResponse } from './billing.dto';

@Injectable()
export class BillingRunsService {
  private readonly logger = new Logger(BillingRunsService.name);
  private readonly prisma = prisma;

  constructor(
    private readonly auditService: AuditService,
    private readonly invoicesService: InvoicesService
  ) {}

  private mapBillingRun(run: any): BillingRunResponse {
    const totalMinor = Number(run.totalBilledMinor);
    return {
      id: run.id,
      tenantId: run.tenantId,
      executionDate: run.executionDate.toISOString(),
      cycleStart: run.cycleStart.toISOString(),
      cycleEnd: run.cycleEnd.toISOString(),
      invoicesGenerated: run.invoicesGenerated,
      totalBilledMinor: totalMinor,
      totalBilledFormatted: formatCurrency(totalMinor),
      status: run.status,
      isDryRun: run.isDryRun,
      triggeredBy: run.triggeredBy,
    };
  }

  async list(tenantId: string): Promise<BillingRunResponse[]> {
    const runs = await this.prisma.billingRun.findMany({
      where: { tenantId },
      orderBy: { executionDate: 'desc' },
      take: 50,
    });

    return runs.map((r) => this.mapBillingRun(r));
  }

  async executeBillingRun(
    tenantId: string,
    dto: BillingRunDto,
    userId?: string
  ): Promise<BillingRunResponse> {
    const now = new Date();
    // Default cycle: current calendar month
    const cycleStart = dto.cycleStart
      ? new Date(dto.cycleStart)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const cycleEnd = dto.cycleEnd
      ? new Date(dto.cycleEnd)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Due date: 10 days into the cycle
    const dueDate = new Date(cycleStart.getTime() + 10 * 24 * 60 * 60 * 1000);

    // Find all active subscriptions in this organization
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
      include: {
        package: true,
        subscriber: true,
      },
    });

    // Check which ones already have an invoice for this cycleStart
    const existingInvoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        billingPeriodStart: cycleStart,
        subscriptionId: { in: activeSubscriptions.map((s) => s.id) },
      },
      select: { subscriptionId: true },
    });

    const billedSubIds = new Set(existingInvoices.map((i) => i.subscriptionId));
    const eligibleSubscriptions = activeSubscriptions.filter((s) => !billedSubIds.has(s.id));

    let projectedTotalMinor = 0;
    for (const sub of eligibleSubscriptions) {
      projectedTotalMinor += sub.package.priceMinor;
    }

    if (dto.isDryRun) {
      return {
        id: `dry-run-${Date.now()}`,
        tenantId,
        executionDate: now.toISOString(),
        cycleStart: cycleStart.toISOString(),
        cycleEnd: cycleEnd.toISOString(),
        invoicesGenerated: eligibleSubscriptions.length,
        totalBilledMinor: projectedTotalMinor,
        totalBilledFormatted: formatCurrency(projectedTotalMinor),
        status: 'DRY_RUN_COMPLETED',
        isDryRun: true,
        triggeredBy: userId,
      };
    }

    // Live Execution: Generate invoices for all eligible subscriptions
    let generatedCount = 0;
    let actualTotalBilledMinor = 0;

    for (const sub of eligibleSubscriptions) {
      try {
        const inv = await this.invoicesService.generateForSubscription(
          tenantId,
          sub.id,
          cycleStart,
          cycleEnd,
          dueDate,
          userId
        );
        generatedCount++;
        actualTotalBilledMinor += inv.totalMinor;
      } catch (err: any) {
        this.logger.warn(
          `Skipped invoice generation for sub ${sub.id} (${sub.subscriber.fullName}): ${err.message}`
        );
      }
    }

    const runRecord = await this.prisma.billingRun.create({
      data: {
        tenantId,
        executionDate: now,
        cycleStart,
        cycleEnd,
        invoicesGenerated: generatedCount,
        totalBilledMinor: BigInt(actualTotalBilledMinor),
        status: 'COMPLETED',
        isDryRun: false,
        triggeredBy: userId,
      },
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.CONFIG_CHANGED,
        entityType: 'BILLING_RUN',
        entityId: runRecord.id,
        details: {
          invoicesGenerated: generatedCount,
          totalBilledMinor: actualTotalBilledMinor,
          cycleStart: cycleStart.toISOString(),
          cycleEnd: cycleEnd.toISOString(),
        },
      });
    }

    return this.mapBillingRun(runRecord);
  }
}
