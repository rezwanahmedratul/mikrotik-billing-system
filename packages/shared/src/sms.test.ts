import { describe, it, expect } from 'vitest';
import {
  normalizePhoneNumber,
  isValidBdPhoneNumber,
  renderNotificationTemplate,
} from './sms.interface';
import { MockSmsAdapter } from './mock-sms-adapter';
import { SmsStatus, SmsTemplateType } from './index';

describe('SMS Notification Foundation & Mock Provider', () => {
  it('normalizes and validates Bangladeshi mobile numbers', () => {
    expect(normalizePhoneNumber('01715000001')).toBe('8801715000001');
    expect(normalizePhoneNumber('+8801819999888')).toBe('8801819999888');
    expect(normalizePhoneNumber('8801912345678')).toBe('8801912345678');

    expect(isValidBdPhoneNumber('01715000001')).toBe(true);
    expect(isValidBdPhoneNumber('+8801819999888')).toBe(true);
    expect(isValidBdPhoneNumber('01212345678')).toBe(false); // Invalid prefix 012
    expect(isValidBdPhoneNumber('017123')).toBe(false); // Too short
    expect(isValidBdPhoneNumber('abcdefg')).toBe(false);
  });

  it('safely renders notification templates with variables and detects missing ones', () => {
    const template = 'Dear {{name}}, invoice {{invoiceNumber}} for BDT {{amount}} is due on {{dueDate}}.';

    // All variables provided
    const res1 = renderNotificationTemplate(template, {
      name: 'Rahim Khan',
      invoiceNumber: 'INV-00101',
      amount: '1200.00',
      dueDate: '2026-11-10',
    });
    expect(res1.renderedText).toBe('Dear Rahim Khan, invoice INV-00101 for BDT 1200.00 is due on 2026-11-10.');
    expect(res1.missingVariables.length).toBe(0);

    // Missing dueDate
    const res2 = renderNotificationTemplate(template, {
      name: 'Rahim Khan',
      invoiceNumber: 'INV-00101',
      amount: '1200.00',
    });
    expect(res2.renderedText).toContain('{{dueDate}}');
    expect(res2.missingVariables).toEqual(['dueDate']);
  });

  it('sends SMS via MockSmsAdapter without reaching real network', async () => {
    const adapter = new MockSmsAdapter();
    const result = await adapter.sendSms({
      to: '8801715000001',
      message: 'Your payment was received. Thank you.',
      tenantId: 'tenant-1',
      templateType: SmsTemplateType.PAYMENT_RECEIVED,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe(SmsStatus.DELIVERED);
    expect(adapter.sentMessages.length).toBe(1);
    expect(adapter.sentMessages[0].to).toBe('8801715000001');
  });

  it('simulates provider errors and timeouts reliably', async () => {
    const adapter = new MockSmsAdapter();
    adapter.setSimulateFailure(true, 'Gateway throttled');

    const result = await adapter.sendSms({
      to: '8801715000001',
      message: 'Due reminder',
      tenantId: 'tenant-1',
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe(SmsStatus.FAILED);
    expect(result.error).toBe('Gateway throttled');
  });
});
