import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { prisma } from '@mikrotik-billing/database';
import {
  InvoiceStatus,
  PaymentStatus,
  AuditAction,
  formatCurrency,
} from '@mikrotik-billing/shared';
import { AuditService } from '../common/audit.service';
import {
  RecordPaymentDto,
  PaymentResponse,
  ReconciliationReportResponse,
  MethodBreakdown,
  CollectorBreakdown,
} from './billing.dto';

@Injectable()
export class PaymentsService {
  private readonly prisma = prisma;

  constructor(private readonly auditService: AuditService) {}

  private async generatePaymentNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.payment.count({ where: { tenantId } });
    const padded = String(count + 1).padStart(5, '0');
    return `PAY-${padded}`;
  }

  private mapPayment(p: any): PaymentResponse {
    return {
      id: p.id,
      tenantId: p.tenantId,
      paymentNumber: p.paymentNumber,
      subscriberId: p.subscriberId,
      subscriberName: p.subscriber?.fullName || 'Client',
      accountNumber: p.subscriber?.accountNumber || '',
      amountMinor: p.amountMinor,
      amountFormatted: formatCurrency(p.amountMinor),
      currency: p.currency,
      method: p.method,
      status: p.status as PaymentStatus,
      externalReference: p.externalReference,
      collectedBy: p.collectedBy,
      notes: p.notes,
      paidAt: p.paidAt.toISOString(),
      allocations: (p.allocations || []).map((a: any) => ({
        invoiceId: a.invoiceId,
        invoiceNumber: a.invoice?.invoiceNumber || '',
        amountMinor: a.amountMinor,
        amountFormatted: formatCurrency(a.amountMinor),
      })),
    };
  }

  async list(tenantId: string, options: { subscriberId?: string; search?: string } = {}) {
    const where: any = { tenantId };

    if (options.subscriberId) {
      where.subscriberId = options.subscriberId;
    }

    if (options.search?.trim()) {
      const q = options.search.trim();
      where.OR = [
        { paymentNumber: { contains: q, mode: 'insensitive' } },
        { subscriber: { fullName: { contains: q, mode: 'insensitive' } } },
        { subscriber: { phone: { contains: q, mode: 'insensitive' } } },
        { externalReference: { contains: q, mode: 'insensitive' } },
      ];
    }

    const payments = await this.prisma.payment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      include: {
        subscriber: true,
        allocations: { include: { invoice: true } },
      },
    });

    return payments.map((p) => this.mapPayment(p));
  }

  async recordPayment(
    tenantId: string,
    dto: RecordPaymentDto,
    userId?: string
  ): Promise<PaymentResponse> {
    if (dto.amountMinor <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    const subscriber = await this.prisma.subscriber.findFirst({
      where: { id: dto.subscriberId, tenantId },
    });

    if (!subscriber) {
      throw new NotFoundException(`Subscriber with ID '${dto.subscriberId}' was not found.`);
    }

    if (dto.externalReference?.trim()) {
      const trimmedRef = dto.externalReference.trim();
      const existing = await this.prisma.payment.findFirst({
        where: {
          tenantId,
          externalReference: trimmedRef,
          status: { not: PaymentStatus.REVERSED },
        },
      });

      if (existing) {
        throw new ConflictException(
          `A payment with external reference '${trimmedRef}' already exists.`
        );
      }
    }

    // Find unpaid invoices for allocation
    let targetInvoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        subscriberId: dto.subscriberId,
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
        balanceMinor: { gt: 0 },
      },
      orderBy: { issuedAt: 'asc' }, // FIFO allocation
    });

    // If specific invoice specified, prioritize it
    if (dto.invoiceId) {
      const specific = targetInvoices.find((i) => i.id === dto.invoiceId);
      if (specific) {
        targetInvoices = [specific, ...targetInvoices.filter((i) => i.id !== dto.invoiceId)];
      }
    }

    const paymentNumber = await this.generatePaymentNumber(tenantId);
    let remainingToAllocate = dto.amountMinor;
    const allocationsToCreate: { invoiceId: string; amountMinor: number }[] = [];
    const invoiceUpdates: {
      id: string;
      paidAmountMinor: number;
      balanceMinor: number;
      status: InvoiceStatus;
      paidAt?: Date;
    }[] = [];

    for (const inv of targetInvoices) {
      if (remainingToAllocate <= 0) break;

      const allocAmount = Math.min(remainingToAllocate, inv.balanceMinor);
      const newPaid = inv.paidAmountMinor + allocAmount;
      const newBalance = inv.totalMinor - newPaid;
      const newStatus = newBalance === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;

      allocationsToCreate.push({
        invoiceId: inv.id,
        amountMinor: allocAmount,
      });

      invoiceUpdates.push({
        id: inv.id,
        paidAmountMinor: newPaid,
        balanceMinor: newBalance,
        status: newStatus,
        paidAt: newStatus === InvoiceStatus.PAID ? new Date() : undefined,
      });

      remainingToAllocate -= allocAmount;
    }

    // Execute payment and allocations transactionally
    const payment = await this.prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          tenantId,
          subscriberId: subscriber.id,
          paymentNumber,
          amountMinor: dto.amountMinor,
          currency: 'BDT',
          method: dto.method,
          status: PaymentStatus.CONFIRMED,
          externalReference: dto.externalReference?.trim() || null,
          collectedBy: userId,
          notes: dto.notes?.trim() || null,
          paidAt: new Date(),
        },
      });

      for (const alloc of allocationsToCreate) {
        await tx.paymentAllocation.create({
          data: {
            paymentId: p.id,
            invoiceId: alloc.invoiceId,
            amountMinor: alloc.amountMinor,
          },
        });
      }

      for (const update of invoiceUpdates) {
        await tx.invoice.update({
          where: { id: update.id },
          data: {
            paidAmountMinor: update.paidAmountMinor,
            balanceMinor: update.balanceMinor,
            status: update.status,
            paidAt: update.paidAt,
          },
        });
      }

      return tx.payment.findUnique({
        where: { id: p.id },
        include: {
          subscriber: true,
          allocations: { include: { invoice: true } },
        },
      });
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.PAYMENT_RECORDED,
        entityType: 'PAYMENT',
        entityId: payment!.id,
        details: {
          paymentNumber,
          subscriber: subscriber.fullName,
          amountMinor: dto.amountMinor,
          method: dto.method,
          allocatedInvoicesCount: allocationsToCreate.length,
        },
      });
    }

    return this.mapPayment(payment);
  }

  async reversePayment(
    tenantId: string,
    paymentId: string,
    reason?: string,
    userId?: string
  ): Promise<PaymentResponse> {
    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, tenantId },
      include: {
        allocations: { include: { invoice: true } },
        subscriber: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID '${paymentId}' was not found.`);
    }

    if (payment.status === PaymentStatus.REVERSED) {
      throw new BadRequestException('This payment has already been reversed.');
    }

    // Revert allocations and invoice balances transactionally
    const updated = await this.prisma.$transaction(async (tx) => {
      for (const alloc of payment.allocations) {
        const inv = alloc.invoice;
        const newPaid = Math.max(0, inv.paidAmountMinor - alloc.amountMinor);
        const newBalance = inv.totalMinor - newPaid;
        const newStatus = newPaid === 0 ? InvoiceStatus.ISSUED : InvoiceStatus.PARTIALLY_PAID;

        await tx.invoice.update({
          where: { id: inv.id },
          data: {
            paidAmountMinor: newPaid,
            balanceMinor: newBalance,
            status: newStatus,
            paidAt: null,
          },
        });
      }

      return tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REVERSED,
          notes: reason ? `${payment.notes || ''} [Reversed: ${reason}]`.trim() : payment.notes,
        },
        include: {
          subscriber: true,
          allocations: { include: { invoice: true } },
        },
      });
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.PAYMENT_REVERSED,
        entityType: 'PAYMENT',
        entityId: paymentId,
        details: {
          paymentNumber: payment.paymentNumber,
          amountMinor: payment.amountMinor,
          reason,
        },
      });
    }

    return this.mapPayment(updated);
  }

  async getReconciliationReport(
    tenantId: string,
    options: { startDate?: string; endDate?: string } = {}
  ): Promise<ReconciliationReportResponse> {
    const where: any = { tenantId };
    const now = new Date();
    const periodStart = options.startDate
      ? new Date(options.startDate)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = options.endDate
      ? new Date(options.endDate)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    where.paidAt = {
      gte: periodStart,
      lte: periodEnd,
    };

    const payments = await this.prisma.payment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      include: {
        subscriber: true,
      },
    });

    let totalConfirmedMinor = 0;
    let totalReversedMinor = 0;
    let paymentsCount = 0;
    let reversedCount = 0;

    const methodMap = new Map<string, { count: number; totalMinor: number }>();
    const collectorMap = new Map<string, { count: number; totalMinor: number }>();

    for (const p of payments) {
      if (p.status === PaymentStatus.CONFIRMED) {
        totalConfirmedMinor += p.amountMinor;
        paymentsCount++;

        const m = p.method;
        const currentM = methodMap.get(m) || { count: 0, totalMinor: 0 };
        methodMap.set(m, {
          count: currentM.count + 1,
          totalMinor: currentM.totalMinor + p.amountMinor,
        });

        const c = p.collectedBy || 'Self-Service / Online';
        const currentC = collectorMap.get(c) || { count: 0, totalMinor: 0 };
        collectorMap.set(c, {
          count: currentC.count + 1,
          totalMinor: currentC.totalMinor + p.amountMinor,
        });
      } else if (p.status === PaymentStatus.REVERSED) {
        totalReversedMinor += p.amountMinor;
        reversedCount++;
      }
    }

    const byMethod: MethodBreakdown[] = Array.from(methodMap.entries()).map(
      ([method, data]) => ({
        method,
        count: data.count,
        totalMinor: data.totalMinor,
        totalFormatted: formatCurrency(data.totalMinor),
      })
    );

    const byCollector: CollectorBreakdown[] = Array.from(collectorMap.entries()).map(
      ([collector, data]) => ({
        collector,
        count: data.count,
        totalMinor: data.totalMinor,
        totalFormatted: formatCurrency(data.totalMinor),
      })
    );

    const netCollectedMinor = totalConfirmedMinor - totalReversedMinor;

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalConfirmedMinor,
      totalReversedMinor,
      netCollectedMinor,
      totalConfirmedFormatted: formatCurrency(totalConfirmedMinor),
      totalReversedFormatted: formatCurrency(totalReversedMinor),
      netCollectedFormatted: formatCurrency(netCollectedMinor),
      paymentsCount,
      reversedCount,
      byMethod,
      byCollector,
    };
  }
}
