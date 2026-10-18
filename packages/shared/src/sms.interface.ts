import { SmsStatus, SmsTemplateType } from './index';

export interface SmsSendRequest {
  to: string;
  message: string;
  tenantId: string;
  templateType?: SmsTemplateType;
  metadata?: Record<string, any>;
}

export interface SmsSendResult {
  success: boolean;
  messageId: string;
  provider: string;
  status: SmsStatus;
  error?: string;
  providerResponseCode?: string;
}

export interface SmsAdapter {
  readonly provider: string;
  sendSms(req: SmsSendRequest): Promise<SmsSendResult>;
  queryDeliveryStatus?(messageId: string): Promise<SmsStatus>;
}

/**
 * Standard phone number normalization and validation utility.
 * Supports BD format: +8801XXXXXXXXX or 01XXXXXXXXX
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  let cleaned = rawPhone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+880')) {
    cleaned = cleaned.substring(1); // remove leading +
  } else if (cleaned.startsWith('01')) {
    cleaned = '88' + cleaned;
  }

  return cleaned;
}

export function isValidBdPhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // BD phone numbers in E.164 without plus: 8801[3-9]XXXXXXXX (13 digits total)
  return /^8801[3-9]\d{8}$/.test(normalized);
}

/**
 * Safe template rendering replacing {{variable}} placeholders with values.
 */
export function renderNotificationTemplate(
  templateText: string,
  variables: Record<string, string | number | undefined | null>
): { renderedText: string; missingVariables: string[] } {
  const missingVariables: string[] = [];

  const renderedText = templateText.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, varName) => {
    const val = variables[varName];
    if (val === undefined || val === null) {
      missingVariables.push(varName);
      return match; // keep placeholder
    }
    return String(val);
  });

  return { renderedText, missingVariables };
}
