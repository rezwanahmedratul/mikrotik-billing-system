import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@mikrotik-billing/database';
import {
  InvoiceStatus,
  AuditAction,
  formatCurrency,
} from '@mikrotik-billing/shared';
import { AuditService } from '../common/audit.service';
import {
  CreateInvoiceDto,
  InvoiceQueryDto,
  InvoiceResponse,
  InvoiceLineResponse,
} from './billing.dto';

@Injectable()
export class InvoicesService {
  private readonly prisma = prisma;

  constructor(private readonly auditService: AuditService) {}

  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { tenantId } });
    const padded = String(count + 1).padStart(5, '0');
    return `INV-${padded}`;
  }

  mapInvoice(inv: any): InvoiceResponse {
    const lines: InvoiceLineResponse[] = (inv.lines || []).map((l: any) => ({
      id: l.id,
      description: l.description,
      quantity: l.quantity,
      unitPriceMinor: l.unitPriceMinor,
      totalMinor: l.totalMinor,
      unitPriceFormatted: formatCurrency(l.unitPriceMinor),
      totalFormatted: formatCurrency(l.totalMinor),
    }));

    return {
      id: inv.id,
      tenantId: inv.tenantId,
      invoiceNumber: inv.invoiceNumber,
      subscriberId: inv.subscriberId,
      subscriberName: inv.subscriber?.fullName || 'Client',
      subscriberPhone: inv.subscriber?.phone || '',
      accountNumber: inv.subscriber?.accountNumber || '',
      packageName: inv.subscription?.package?.name,
      billingPeriodStart: inv.billingPeriodStart.toISOString(),
      billingPeriodEnd: inv.billingPeriodEnd.toISOString(),
      dueDate: inv.dueDate.toISOString(),
      subtotalMinor: inv.subtotalMinor,
      discountMinor: inv.discountMinor,
      taxMinor: inv.taxMinor,
      totalMinor: inv.totalMinor,
      paidAmountMinor: inv.paidAmountMinor,
      balanceMinor: inv.balanceMinor,
      totalFormatted: formatCurrency(inv.totalMinor),
      paidFormatted: formatCurrency(inv.paidAmountMinor),
      balanceFormatted: formatCurrency(inv.balanceMinor),
      status: inv.status as InvoiceStatus,
      issuedAt: inv.issuedAt.toISOString(),
      paidAt: inv.paidAt?.toISOString() || null,
      voidedAt: inv.voidedAt?.toISOString() || null,
      notes: inv.notes,
      lines,
    };
  }

  async list(tenantId: string, query: InvoiceQueryDto = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.subscriberId) {
      where.subscriberId = query.subscriberId;
    }

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { invoiceNumber: { contains: q, mode: 'insensitive' } },
        { subscriber: { fullName: { contains: q, mode: 'insensitive' } } },
        { subscriber: { phone: { contains: q, mode: 'insensitive' } } },
        { subscriber: { accountNumber: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, invoices] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedAt: 'desc' },
        include: {
          subscriber: true,
          subscription: { include: { package: true } },
          lines: true,
        },
      }),
    ]);

    return {
      data: invoices.map((inv) => this.mapInvoice(inv)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getById(tenantId: string, id: string): Promise<InvoiceResponse> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        subscriber: true,
        subscription: { include: { package: true } },
        lines: true,
        allocations: { include: { payment: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID '${id}' was not found.`);
    }

    return this.mapInvoice(invoice);
  }

  async create(tenantId: string, dto: CreateInvoiceDto, userId?: string): Promise<InvoiceResponse> {
    const subscriber = await this.prisma.subscriber.findFirst({
      where: { id: dto.subscriberId, tenantId },
      include: { subscriptions: { take: 1, orderBy: { createdAt: 'desc' } } },
    });

    if (!subscriber) {
      throw new NotFoundException(`Subscriber '${dto.subscriberId}' was not found.`);
    }

    const subscriptionId = dto.subscriptionId || subscriber.subscriptions[0]?.id;
    if (!subscriptionId) {
      throw new BadRequestException('Subscriber has no subscription to bill against.');
    }

    const periodStart = new Date(dto.billingPeriodStart);
    const periodEnd = new Date(dto.billingPeriodEnd);
    const dueDate = new Date(dto.dueDate);

    // Prevent duplicate billing for the same subscription period
    const existingPeriodInvoice = await this.prisma.invoice.findFirst({
      where: {
        subscriptionId,
        billingPeriodStart: periodStart,
      },
    });

    if (existingPeriodInvoice) {
      throw new ConflictException(
        `An invoice (${existingPeriodInvoice.invoiceNumber}) already exists for this subscription period.`
      );
    }

    let subtotalMinor = 0;
    const linesData = (dto.lines || []).map((l) => {
      const lineTotal = l.quantity * l.unitPriceMinor;
      subtotalMinor += lineTotal;
      return {
        description: l.description,
        quantity: l.quantity,
        unitPriceMinor: l.unitPriceMinor,
        totalMinor: lineTotal,
      };
    });

    if (linesData.length === 0) {
      throw new BadRequestException('Invoice must contain at least one line item.');
    }

    const discountMinor = dto.discountMinor || 0;
    const taxMinor = dto.taxMinor || 0;
    const totalMinor = Math.max(0, subtotalMinor - discountMinor + taxMinor);
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        subscriberId: subscriber.id,
        subscriptionId,
        invoiceNumber,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        dueDate,
        subtotalMinor,
        discountMinor,
        taxMinor,
        totalMinor,
        paidAmountMinor: 0,
        balanceMinor: totalMinor,
        status: InvoiceStatus.ISSUED,
        notes: dto.notes,
        lines: {
          create: linesData,
        },
      },
      include: {
        subscriber: true,
        subscription: { include: { package: true } },
        lines: true,
      },
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.INVOICE_GENERATED,
        entityType: 'INVOICE',
        entityId: invoice.id,
        details: {
          invoiceNumber,
          subscriber: subscriber.fullName,
          totalMinor,
        },
      });
    }

    return this.mapInvoice(invoice);
  }

  async generateForSubscription(
    tenantId: string,
    subscriptionId: string,
    cycleStart: Date,
    cycleEnd: Date,
    dueDate: Date,
    userId?: string
  ): Promise<InvoiceResponse> {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
      include: { package: true, subscriber: true },
    });

    if (!sub) {
      throw new NotFoundException(`Subscription '${subscriptionId}' was not found.`);
    }

    return this.create(
      tenantId,
      {
        subscriberId: sub.subscriberId,
        subscriptionId: sub.id,
        billingPeriodStart: cycleStart.toISOString(),
        billingPeriodEnd: cycleEnd.toISOString(),
        dueDate: dueDate.toISOString(),
        lines: [
          {
            description: `${sub.package.name} (${sub.package.speedLimitRaw}) Monthly Subscription`,
            quantity: 1,
            unitPriceMinor: sub.package.priceMinor,
          },
        ],
        notes: `Automated bill for cycle ${cycleStart.toLocaleDateString()} - ${cycleEnd.toLocaleDateString()}`,
      },
      userId
    );
  }

  async voidInvoice(
    tenantId: string,
    id: string,
    reason?: string,
    userId?: string
  ): Promise<InvoiceResponse> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID '${id}' was not found.`);
    }

    if (invoice.paidAmountMinor > 0) {
      throw new BadRequestException(
        `Cannot void invoice '${invoice.invoiceNumber}' because it already has recorded payments. Reverse payments first.`
      );
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.VOID,
        voidedAt: new Date(),
        notes: reason ? `${invoice.notes || ''} [Voided: ${reason}]`.trim() : invoice.notes,
      },
      include: {
        subscriber: true,
        subscription: { include: { package: true } },
        lines: true,
      },
    });

    if (userId) {
      await this.auditService.log({
        tenantId,
        userId,
        action: AuditAction.CONFIG_CHANGED,
        entityType: 'INVOICE',
        entityId: id,
        details: { action: 'VOID_INVOICE', reason },
      });
    }

    return this.mapInvoice(updated);
  }
}
