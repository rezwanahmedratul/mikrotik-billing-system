import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class InitiateGatewayPaymentDto {
  @IsString()
  @IsNotEmpty()
  subscriberId!: string;

  @IsString()
  @IsOptional()
  invoiceId?: string;

  @IsInt()
  @Min(1)
  amountMinor!: number;

  @IsString()
  @IsNotEmpty()
  provider!: string; // 'BKASH' | 'NAGAD' | 'STRIPE' | 'SANDBOX_MOCK'

  @IsString()
  @IsNotEmpty()
  callbackUrl!: string;
}

export interface GatewayPaymentInitiatedResponse {
  gatewayPaymentId: string;
  checkoutUrl: string;
  provider: string;
  amountMinor: number;
  amountFormatted: string;
  currency: string;
  expiresAt?: string;
}

export interface WebhookEventResponse {
  id: string;
  provider: string;
  eventId: string;
  eventType: string;
  isProcessed: boolean;
  processedAt?: string | null;
  createdAt: string;
}

export interface WebhookProcessResult {
  status: 'success' | 'already_processed' | 'rejected';
  eventId: string;
  paymentNumber?: string;
  message?: string;
}
