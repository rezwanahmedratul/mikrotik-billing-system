import { IsBoolean, IsOptional, IsInt, Min, IsString, IsNotEmpty, IsIn } from 'class-validator';

export class RunLifecycleCycleDto {
  @IsBoolean()
  @IsOptional()
  isDryRun?: boolean = false;

  @IsInt()
  @Min(0)
  @IsOptional()
  gracePeriodDays?: number = 3;

  @IsString()
  @IsOptional()
  targetDate?: string;
}

export class ManualLifecycleOverrideDto {
  @IsString()
  @IsNotEmpty()
  subscriptionId!: string;

  @IsIn(['SUSPEND', 'RESTORE', 'EXTEND_GRACE'])
  action!: 'SUSPEND' | 'RESTORE' | 'EXTEND_GRACE';

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  graceDays?: number;
}

export interface LifecycleActionItem {
  subscriptionId: string;
  subscriberName: string;
  subscriberPhone: string;
  accountNumber: string;
  action: 'SUSPEND' | 'RESTORE' | 'REMINDER';
  reason: string;
  invoiceId?: string;
  balanceFormatted?: string;
}

export interface LifecycleCycleResult {
  executionDate: string;
  isDryRun: boolean;
  dueRemindersSent: number;
  subscriptionsSuspended: number;
  subscriptionsRestored: number;
  actions: LifecycleActionItem[];
}

export interface ServiceDiscrepancyItem {
  subscriptionId: string;
  subscriber: string;
  accountNumber: string;
  issue: string;
  resolution: string;
}

export interface ServiceReconciliationReport {
  reconciledAt: string;
  totalSubscriptions: number;
  activeCount: number;
  suspendedCount: number;
  discrepancies: ServiceDiscrepancyItem[];
}
