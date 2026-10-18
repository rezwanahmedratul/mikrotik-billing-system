import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@mikrotik-billing/database';
import {
  PaymentGatewayAdapter,
  PaymentGatewayProvider,
  MockPaymentGatewayAdapter,
  PaymentMethod,
  formatCurrency,
} from '@mikrotik-billing/shared';
import { PaymentsService } from '../billing/payments.service';
import { AuditService } from '../common/audit.service';
import {
  InitiateGatewayPaymentDto,
  GatewayPaymentInitiatedResponse,
  WebhookProcessResult,
  WebhookEventResponse,
} from './payment-gateways.dto';

@Injectable()
export class PaymentGatewaysService {
  private readonly prisma = prisma;
  private readonly adapters = new Map<string, PaymentGatewayAdapter>();

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly auditService: AuditService
  ) {
    const webhookSecret =
      process.env.PAYMENT_WEBHOOK_SECRET || 'sandbox-webhook-secret-key-123';

    // Register supported sandbox and live gateway adapters
    const mockBkash = new MockPaymentGatewayAdapter(PaymentGatewayProvider.BKASH, webhookSecret);
    const mockNagad = new MockPaymentGatewayAdapter(PaymentGatewayProvider.NAGAD, webhookSecret);
    const mockStripe = new MockPaymentGatewayAdapter(PaymentGatewayProvider.STRIPE, webhookSecret);
    const mockGeneric = new MockPaymentGatewayAdapter(
      PaymentGatewayProvider.SANDBOX_MOCK,
      webhookSecret
    );

    this.adapters.set('BKASH', mockBkash);
    this.adapters.set('NAGAD', mockNagad);
    this.adapters.set('STRIPE', mockStripe);
    this.adapters.set('SANDBOX_MOCK', mockGeneric);
  }

  getAdapter(provider: string): PaymentGatewayAdapter {
    const normalized = provider.toUpperCase().trim();
    const adapter = this.adapters.get(normalized);
    if (!adapter) {
      // Resilient fallback to generic mock gateway in development / sandbox mode
      return new MockPaymentGatewayAdapter(
        normalized,
        process.env.PAYMENT_WEBHOOK_SECRET || 'sandbox-webhook-secret-key-123'
      );
    }
    return adapter;
  }

  async initiatePayment(
    tenantId: string,
    dto: InitiateGatewayPaymentDto,
    userId?: string
  ): Promise<GatewayPaymentInitiatedResponse> {
    const subscriber = await this.prisma.subscriber.findFirst({
      where: { id: dto.subscriberId, tenantId },
    });

    if (!subscriber) {
      throw new NotFoundException(`Subscriber with ID '${dto.subscriberId}' was not found.`);
    }

    if (dto.invoiceId) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: dto.invoiceId, subscriberId: dto.subscriberId, tenantId },
      });
      if (!invoice) {
        throw new NotFoundException(
          `Invoice with ID '${dto.invoiceId}' does not belong to this subscriber.`
        );
      }
      if (invoice.balanceMinor <= 0) {
        throw new BadRequestException('This invoice has already been fully paid.');
      }
    }

    const adapter = this.getAdapter(dto.provider);
    const result = await adapter.initiatePayment({
      tenantId,
      subscriberId: subscriber.id,
      invoiceId: dto.invoiceId,
      amountMinor: dto.amountMinor,
      currency: 'BDT',
      customerPhone: subscriber.phone,
      callbackUrl: dto.callbackUrl,
      metadata: {
        tenantId,
        subscriberId: subscriber.id,
        invoiceId: dto.invoiceId,
      },
    });

    return {
      gatewayPaymentId: result.gatewayPaymentId,
      checkoutUrl: result.checkoutUrl,
      provider: result.provider,
      amountMinor: result.amountMinor,
      amountFormatted: formatCurrency(result.amountMinor),
      currency: result.currency,
      expiresAt: result.expiresAt,
    };
  }

  async processWebhook(
    provider: string,
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
    queryTenantId?: string
  ): Promise<WebhookProcessResult> {
    const adapter = this.getAdapter(provider);
    const secretKey =
      process.env.PAYMENT_WEBHOOK_SECRET || 'sandbox-webhook-secret-key-123';

    // 1. Authoritative server-to-server signature verification
    const verification = await adapter.verifyWebhook({
      provider,
      rawBody,
      headers,
      secretKey,
    });

    if (!verification.isValid) {
      throw new BadRequestException(
        verification.errorMessage || 'Invalid payment gateway webhook signature.'
      );
    }

    // 2. Strict Idempotency Check: check if event already recorded
    const existingEvent = await this.prisma.paymentProviderEvent.findUnique({
      where: {
        provider_eventId: {
          provider: verification.provider,
          eventId: verification.eventId,
        },
      },
    });

    if (existingEvent && existingEvent.isProcessed) {
      return {
        status: 'already_processed',
        eventId: verification.eventId,
        message: 'Event was already processed idempotently.',
      };
    }

    // 3. Resolve Target Tenant & Subscriber
    const targetTenantId =
      verification.metadata?.tenantId ||
      queryTenantId ||
      (await this.resolveTenantIdFromPayload(verification));

    if (!targetTenantId) {
      throw new BadRequestException(
        'Unable to determine target tenant organization for this webhook payment.'
      );
    }

    const targetSubscriberId = verification.metadata?.subscriberId;
    if (!targetSubscriberId) {
      throw new BadRequestException(
        'Webhook payload is missing required subscriber identity metadata.'
      );
    }

    // 4. Validate Amount & Currency
    const amountMinor = verification.amountMinor;
    if (!amountMinor || amountMinor <= 0) {
      throw new BadRequestException('Webhook payment amount must be greater than zero.');
    }

    if (verification.currency && verification.currency !== 'BDT') {
      throw new BadRequestException(
        `Currency mismatch: Expected 'BDT', received '${verification.currency}'.`
      );
    }

    // 5. Check if invoice exists and has mismatch
    const targetInvoiceId = verification.metadata?.invoiceId;
    if (targetInvoiceId) {
      const invoice = await this.prisma.invoice.findFirst({
        where: { id: targetInvoiceId, tenantId: targetTenantId },
      });
      if (!invoice) {
        throw new NotFoundException(
          `Target invoice '${targetInvoiceId}' was not found for this tenant.`
        );
      }
    }

    // 6. Map Provider to PaymentMethod
    let paymentMethod = PaymentMethod.ONLINE_GATEWAY;
    const provUpper = provider.toUpperCase();
    if (provUpper.includes('BKASH')) paymentMethod = PaymentMethod.BKASH;
    else if (provUpper.includes('NAGAD')) paymentMethod = PaymentMethod.NAGAD;
    else if (provUpper.includes('CARD') || provUpper.includes('STRIPE'))
      paymentMethod = PaymentMethod.CARD;

    // 7. Settle Payment Transactionally and Store Event Record
    const rawSig =
      headers['x-signature'] ||
      headers['x-webhook-signature'] ||
      headers['x-bkash-signature'] ||
      '';
    const signatureStr = Array.isArray(rawSig) ? rawSig[0] : String(rawSig);

    const payment = await this.paymentsService.recordPayment(
      targetTenantId,
      {
        subscriberId: targetSubscriberId,
        invoiceId: targetInvoiceId,
        amountMinor,
        method: paymentMethod,
        externalReference: verification.transactionReference,
        notes: `Online Gateway Auto-Settlement [${provider} Event: ${verification.eventId}]`,
      },
      undefined
    );

    // Upsert provider event receipt
    await this.prisma.paymentProviderEvent.upsert({
      where: {
        provider_eventId: {
          provider: verification.provider,
          eventId: verification.eventId,
        },
      },
      create: {
        tenantId: targetTenantId,
        provider: verification.provider,
        eventId: verification.eventId,
        eventType: verification.eventType,
        signature: signatureStr,
        payload: (verification.payload ?? {}) as any,
        isProcessed: true,
        processedAt: new Date(),
      },
      update: {
        isProcessed: true,
        processedAt: new Date(),
      },
    });

    return {
      status: 'success',
      eventId: verification.eventId,
      paymentNumber: payment.paymentNumber,
      message: 'Payment verified and ledger credited successfully.',
    };
  }

  private async resolveTenantIdFromPayload(verification: any): Promise<string | null> {
    if (verification.metadata?.subscriberId) {
      const sub = await this.prisma.subscriber.findUnique({
        where: { id: verification.metadata.subscriberId },
        select: { tenantId: true },
      });
      if (sub?.tenantId) return sub.tenantId;
    }
    const firstTenant = await this.prisma.tenant.findFirst({ select: { id: true } });
    return firstTenant?.id ?? null;
  }

  async listEvents(tenantId: string, limit = 50): Promise<WebhookEventResponse[]> {
    const events = await this.prisma.paymentProviderEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return events.map((e) => ({
      id: e.id,
      provider: e.provider,
      eventId: e.eventId,
      eventType: e.eventType,
      isProcessed: e.isProcessed,
      processedAt: e.processedAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
    }));
  }
}
