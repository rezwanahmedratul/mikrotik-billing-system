import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@mikrotik-billing/database';
import {
  SmsAdapter,
  MockSmsAdapter,
  SmsStatus,
  SmsTemplateType,
  normalizePhoneNumber,
  isValidBdPhoneNumber,
  renderNotificationTemplate,
} from '@mikrotik-billing/shared';
import { AuditService } from '../common/audit.service';
import {
  SendDirectSmsDto,
  SendTemplateSmsDto,
  UpdateTemplateDto,
  NotificationJobResponse,
  NotificationTemplateResponse,
} from './notifications.dto';

const DEFAULT_TEMPLATES: { type: SmsTemplateType; name: string; templateText: string }[] = [
  {
    type: SmsTemplateType.INVOICE_ISSUED,
    name: 'Invoice Issued',
    templateText:
      'Dear {{name}}, invoice #{{invoiceNumber}} of BDT {{amount}} is issued. Due date: {{dueDate}}. Pay online to avoid disconnection.',
  },
  {
    type: SmsTemplateType.PAYMENT_RECEIVED,
    name: 'Payment Confirmation',
    templateText:
      'Dear {{name}}, we received your payment of BDT {{amount}} (Ref: {{transactionReference}}). Account balance: BDT {{balance}}. Thank you.',
  },
  {
    type: SmsTemplateType.DUE_REMINDER,
    name: 'Due Date Reminder',
    templateText:
      'Reminder: Dear {{name}}, invoice #{{invoiceNumber}} of BDT {{amount}} is due on {{dueDate}}. Please pay promptly to maintain service.',
  },
  {
    type: SmsTemplateType.SUSPENSION_WARNING,
    name: 'Suspension Warning',
    templateText:
      'Urgent: Dear {{name}}, your internet will be suspended on {{suspensionDate}} due to unpaid balance of BDT {{amount}}. Pay now to stay online.',
  },
  {
    type: SmsTemplateType.SERVICE_SUSPENDED,
    name: 'Service Suspended',
    templateText:
      'Notice: Dear {{name}}, your internet service is currently suspended due to overdue invoice. Please pay BDT {{amount}} for immediate reconnection.',
  },
  {
    type: SmsTemplateType.SERVICE_RESTORED,
    name: 'Service Restored',
    templateText:
      'Dear {{name}}, your payment was verified and internet service has been restored. Thank you for staying with us!',
  },
];

@Injectable()
export class NotificationsService {
  private readonly prisma = prisma;
  private smsAdapter: SmsAdapter;

  constructor(private readonly auditService: AuditService) {
    this.smsAdapter = new MockSmsAdapter();
  }

  setSmsAdapter(adapter: SmsAdapter) {
    this.smsAdapter = adapter;
  }

  getSmsAdapter(): SmsAdapter {
    return this.smsAdapter;
  }

  async ensureDefaultTemplates(tenantId: string): Promise<void> {
    for (const t of DEFAULT_TEMPLATES) {
      await this.prisma.notificationTemplate.upsert({
        where: {
          tenantId_type: {
            tenantId,
            type: t.type,
          },
        },
        create: {
          tenantId,
          type: t.type,
          name: t.name,
          templateText: t.templateText,
          isEnabled: true,
        },
        update: {},
      });
    }
  }

  async listTemplates(tenantId: string): Promise<NotificationTemplateResponse[]> {
    await this.ensureDefaultTemplates(tenantId);

    const templates = await this.prisma.notificationTemplate.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });

    return templates.map((t) => ({
      id: t.id,
      type: t.type as unknown as SmsTemplateType,
      name: t.name,
      templateText: t.templateText,
      isEnabled: t.isEnabled,
      updatedAt: t.updatedAt.toISOString(),
    }));
  }

  async updateTemplate(
    tenantId: string,
    type: SmsTemplateType,
    dto: UpdateTemplateDto,
    userId?: string
  ): Promise<NotificationTemplateResponse> {
    const existing = await this.prisma.notificationTemplate.findUnique({
      where: { tenantId_type: { tenantId, type } },
    });

    if (!existing) {
      throw new NotFoundException(`Template with type '${type}' was not found.`);
    }

    const updated = await this.prisma.notificationTemplate.update({
      where: { id: existing.id },
      data: {
        templateText: dto.templateText.trim(),
        isEnabled: dto.isEnabled !== undefined ? dto.isEnabled : existing.isEnabled,
      },
    });

    return {
      id: updated.id,
      type: updated.type as unknown as SmsTemplateType,
      name: updated.name,
      templateText: updated.templateText,
      isEnabled: updated.isEnabled,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async enqueueDirectSms(
    tenantId: string,
    dto: SendDirectSmsDto,
    userId?: string
  ): Promise<NotificationJobResponse> {
    const normalizedPhone = normalizePhoneNumber(dto.recipientPhone);
    if (!isValidBdPhoneNumber(normalizedPhone)) {
      throw new BadRequestException(
        `Invalid recipient phone number '${dto.recipientPhone}'. Must be a valid 11-digit Bangladeshi mobile number.`
      );
    }

    const message = dto.message.trim();
    if (!message) {
      throw new BadRequestException('Message body cannot be empty.');
    }

    const job = await this.prisma.notificationJob.create({
      data: {
        tenantId,
        recipientPhone: normalizedPhone,
        message,
        status: SmsStatus.QUEUED,
        attempts: 0,
      },
    });

    // Attempt synchronous/immediate dispatch with background recovery
    return this.dispatchJob(job.id);
  }

  async sendTemplateSms(
    tenantId: string,
    dto: SendTemplateSmsDto,
    userId?: string
  ): Promise<NotificationJobResponse | null> {
    await this.ensureDefaultTemplates(tenantId);

    const template = await this.prisma.notificationTemplate.findUnique({
      where: { tenantId_type: { tenantId, type: dto.type } },
    });

    if (!template || !template.isEnabled) {
      // Skips disabled templates safely without throwing
      return null;
    }

    const normalizedPhone = normalizePhoneNumber(dto.recipientPhone);
    if (!isValidBdPhoneNumber(normalizedPhone)) {
      throw new BadRequestException(
        `Invalid recipient phone number '${dto.recipientPhone}'. Must be a valid 11-digit Bangladeshi mobile number.`
      );
    }

    const vars: Record<string, any> = { ...(dto.variables || {}) };
    if (vars.name !== undefined && vars.subscriberName === undefined) vars.subscriberName = vars.name;
    if (vars.subscriberName !== undefined && vars.name === undefined) vars.name = vars.subscriberName;
    if (vars.transactionReference !== undefined && vars.paymentNumber === undefined) vars.paymentNumber = vars.transactionReference;
    if (vars.paymentNumber !== undefined && vars.transactionReference === undefined) vars.transactionReference = vars.paymentNumber;

    const { renderedText } = renderNotificationTemplate(
      template.templateText,
      vars
    );

    const job = await this.prisma.notificationJob.create({
      data: {
        tenantId,
        recipientPhone: normalizedPhone,
        message: renderedText,
        status: SmsStatus.QUEUED,
        attempts: 0,
      },
    });

    return this.dispatchJob(job.id);
  }

  async dispatchJob(jobId: string): Promise<NotificationJobResponse> {
    const job = await this.prisma.notificationJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException(`Notification job '${jobId}' was not found.`);
    }

    const newAttempts = job.attempts + 1;

    try {
      const sendResult = await this.smsAdapter.sendSms({
        to: job.recipientPhone,
        message: job.message,
        tenantId: job.tenantId,
      });

      if (sendResult.success) {
        const updated = await this.prisma.notificationJob.update({
          where: { id: jobId },
          data: {
            status: sendResult.status,
            attempts: newAttempts,
            error: null,
            sentAt: new Date(),
            providerResponse: {
              provider: sendResult.provider,
              messageId: sendResult.messageId,
              responseCode: sendResult.providerResponseCode,
            },
          },
        });
        return this.mapJob(updated);
      } else {
        const updated = await this.prisma.notificationJob.update({
          where: { id: jobId },
          data: {
            status: SmsStatus.FAILED,
            attempts: newAttempts,
            error: sendResult.error || 'Provider rejected message',
            providerResponse: {
              provider: sendResult.provider,
              error: sendResult.error,
              responseCode: sendResult.providerResponseCode,
            },
          },
        });
        return this.mapJob(updated);
      }
    } catch (err: any) {
      const updated = await this.prisma.notificationJob.update({
        where: { id: jobId },
        data: {
          status: SmsStatus.FAILED,
          attempts: newAttempts,
          error: err.message || 'Network exception connecting to SMS provider',
        },
      });
      return this.mapJob(updated);
    }
  }

  async retryJob(tenantId: string, jobId: string): Promise<NotificationJobResponse> {
    const job = await this.prisma.notificationJob.findFirst({
      where: { id: jobId, tenantId },
    });

    if (!job) {
      throw new NotFoundException(`Notification job '${jobId}' was not found.`);
    }

    return this.dispatchJob(job.id);
  }

  async listJobs(
    tenantId: string,
    options: { status?: SmsStatus; search?: string; limit?: number } = {}
  ): Promise<NotificationJobResponse[]> {
    const where: any = { tenantId };

    if (options.status) {
      where.status = options.status;
    }

    if (options.search?.trim()) {
      const q = options.search.trim();
      where.OR = [
        { recipientPhone: { contains: q, mode: 'insensitive' } },
        { message: { contains: q, mode: 'insensitive' } },
      ];
    }

    const jobs = await this.prisma.notificationJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
    });

    return jobs.map((j) => this.mapJob(j));
  }

  private mapJob(j: any): NotificationJobResponse {
    return {
      id: j.id,
      recipientPhone: j.recipientPhone,
      recipientEmail: j.recipientEmail,
      message: j.message,
      status: j.status as SmsStatus,
      attempts: j.attempts,
      error: j.error,
      sentAt: j.sentAt ? j.sentAt.toISOString() : null,
      createdAt: j.createdAt.toISOString(),
    };
  }
}
