export class RunLifecycleCycleDto {
  isDryRun?: boolean = false;
  gracePeriodDays?: number = 3;
  targetDate?: string;
}

export class ManualLifecycleOverrideDto {
  subscriptionId!: string;
  action!: 'SUSPEND' | 'RESTORE' | 'EXTEND_GRACE';
  reason!: string;
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
