import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { SmsStatus, SmsTemplateType } from '@mikrotik-billing/shared';

export class SendDirectSmsDto {
  @IsString()
  @IsNotEmpty()
  recipientPhone!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}

export class SendTemplateSmsDto {
  @IsString()
  @IsNotEmpty()
  recipientPhone!: string;

  @IsEnum(SmsTemplateType)
  type!: SmsTemplateType;

  @IsOptional()
  variables?: Record<string, string | number>;
}

export class UpdateTemplateDto {
  @IsString()
  @IsNotEmpty()
  templateText!: string;

  @IsBoolean()
  @IsOptional()
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
