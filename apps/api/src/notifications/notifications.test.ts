import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@mikrotik-billing/database';
import {
  SmsStatus,
  SmsTemplateType,
  MockSmsAdapter,
} from '@mikrotik-billing/shared';
import { NotificationsService } from './notifications.service.js';
import { AuditService } from '../common/audit.service.js';
import { AuthService } from '../auth/auth.service.js';

describe('Notifications & SMS System (Section 14)', () => {
  const auditService = new AuditService();
  const authService = new AuthService(auditService);
  const notificationsService = new NotificationsService(auditService);
  const mockAdapter = new MockSmsAdapter();

  let tenant: any;
  let admin: any;

  beforeAll(async () => {
    notificationsService.setSmsAdapter(mockAdapter);

    const reg = await authService.registerTenant({
      tenantName: 'Notification Test ISP',
      tenantCode: `NOTIF_${Date.now()}`,
      adminEmail: `notif_admin_${Date.now()}@example.com`,
      adminPassword: 'Password123!',
      adminFullName: 'Notification Admin',
    });
    tenant = reg.tenant;
    admin = reg.user;
  });

  afterAll(async () => {
    if (tenant?.id) {
      await prisma.tenant.delete({ where: { id: tenant.id } }).catch(() => {});
    }
  });

  beforeEach(async () => {
    mockAdapter.clearHistory();
    if (tenant?.id) {
      await prisma.notificationJob.deleteMany({ where: { tenantId: tenant.id } });
    }
  });

  it('seeds default configurable templates and allows updates', async () => {
    const templates = await notificationsService.listTemplates(tenant.id);
    expect(templates.length).toBe(6);

    const invoiceTemplate = templates.find((t) => t.type === SmsTemplateType.INVOICE_ISSUED);
    expect(invoiceTemplate).toBeDefined();
    expect(invoiceTemplate?.isEnabled).toBe(true);

    // Update template text
    const updated = await notificationsService.updateTemplate(
      tenant.id,
      SmsTemplateType.INVOICE_ISSUED,
      {
        templateText: 'Custom: Invoice {{invoiceNumber}} is due on {{dueDate}}.',
        isEnabled: true,
      },
      admin.id
    );

    expect(updated.templateText).toBe('Custom: Invoice {{invoiceNumber}} is due on {{dueDate}}.');
  });

  it('safely renders template notification and dispatches to mock provider', async () => {
    const job = await notificationsService.sendTemplateSms(
      tenant.id,
      {
        recipientPhone: '01715000001',
        type: SmsTemplateType.PAYMENT_RECEIVED,
        variables: {
          name: 'Tareq Rahman',
          amount: '1500.00',
          transactionReference: 'TRX998811',
          balance: '0.00',
        },
      },
      admin.id
    );

    expect(job).not.toBeNull();
    expect(job?.status).toBe(SmsStatus.DELIVERED);
    expect(job?.recipientPhone).toBe('8801715000001'); // Normalized
    expect(job?.message).toContain('Tareq Rahman');
    expect(job?.message).toContain('1500.00');
    expect(job?.message).toContain('TRX998811');

    // Verified message in mock history
    expect(mockAdapter.sentMessages.length).toBe(1);
    expect(mockAdapter.sentMessages[0].to).toBe('8801715000001');
  });

  it('rejects invalid or malformed Bangladeshi phone numbers', async () => {
    await expect(
      notificationsService.enqueueDirectSms(tenant.id, {
        recipientPhone: '01234567890', // Invalid prefix 012
        message: 'Test message',
      })
    ).rejects.toThrow('Invalid recipient phone number');

    await expect(
      notificationsService.enqueueDirectSms(tenant.id, {
        recipientPhone: '12345',
        message: 'Test message',
      })
    ).rejects.toThrow('Invalid recipient phone number');
  });

  it('handles provider failures gracefully and allows audited manual retry', async () => {
    // 1. Simulate provider failure
    mockAdapter.setSimulateFailure(true, 'SMS Gateway balance exhausted');

    const failedJob = await notificationsService.enqueueDirectSms(tenant.id, {
      recipientPhone: '01819999888',
      message: 'Urgent service maintenance announcement.',
    });

    expect(failedJob.status).toBe(SmsStatus.FAILED);
    expect(failedJob.attempts).toBe(1);
    expect(failedJob.error).toContain('SMS Gateway balance exhausted');

    // 2. Restore provider health
    mockAdapter.setSimulateFailure(false);

    // 3. Retry the job
    const retriedJob = await notificationsService.retryJob(tenant.id, failedJob.id);

    expect(retriedJob.status).toBe(SmsStatus.DELIVERED);
    expect(retriedJob.attempts).toBe(2);
    expect(retriedJob.error).toBeNull();
  });

  it('skips disabled templates without throwing errors or blocking operations', async () => {
    // Disable suspension warning template
    await notificationsService.updateTemplate(
      tenant.id,
      SmsTemplateType.SUSPENSION_WARNING,
      {
        templateText: 'Disabled template text',
        isEnabled: false,
      }
    );

    const result = await notificationsService.sendTemplateSms(tenant.id, {
      recipientPhone: '01715000001',
      type: SmsTemplateType.SUSPENSION_WARNING,
      variables: { name: 'Client' },
    });

    expect(result).toBeNull();
    expect(mockAdapter.sentMessages.length).toBe(0);
  });
});
