import { SmsStatus, SmsTemplateType } from '@mikrotik-billing/shared';

export class SendDirectSmsDto {
  recipientPhone!: string;
  message!: string;
}

export class SendTemplateSmsDto {
  recipientPhone!: string;
  type!: SmsTemplateType;
  variables?: Record<string, string | number>;
}

export class UpdateTemplateDto {
  templateText!: string;
  isEnabled?: boolean;
}

export interface NotificationJobResponse {
  id: string;
  recipientPhone: string;
  recipientEmail?: string | null;
  message: string;
  status: SmsStatus;
  attempts: number;
  error?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

export interface NotificationTemplateResponse {
  id: string;
  type: SmsTemplateType;
  name: string;
  templateText: string;
  isEnabled: boolean;
  updatedAt: string;
}
