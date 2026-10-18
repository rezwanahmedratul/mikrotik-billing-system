import { AuditAction } from '@mikrotik-billing/shared';

export interface DashboardOverviewDto {
  metrics: {
    activeSubscribers: number;
    suspendedSubscribers: number;
    totalSubscribers: number;
    onlineSessions: number;
    onlineRouters: number;
    totalRouters: number;
    currentMonthBilledMinor: number;
    currentMonthPaidMinor: number;
    outstandingDueMinor: number;
    overdueInvoicesCount: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    actor: string;
    createdAt: string;
    details?: Record<string, unknown>;
  }>;
  dataFreshness: {
    timestamp: string;
    isCached: boolean;
    ttlSeconds: number;
  };
}

export interface CollectionsReportQueryDto {
  startDate?: string;
  endDate?: string;
  method?: string;
  cashierId?: string;
}

export interface CollectionsReportDto {
  grossCollectedMinor: number;
  reversalsMinor: number;
  netCollectedMinor: number;
  totalTransactionsCount: number;
  byMethod: Record<
    string,
    {
      count: number;
      totalMinor: number;
    }
  >;
  byCashier: Array<{
    cashierId: string;
    cashierName: string;
    count: number;
    totalMinor: number;
  }>;
  dailyTrend: Array<{
    date: string;
    grossMinor: number;
    reversalsMinor: number;
    netMinor: number;
    count: number;
  }>;
}

export interface SubscriberGrowthQueryDto {
  startDate?: string;
  endDate?: string;
}

export interface SubscriberGrowthReportDto {
  totalCount: number;
  activeCount: number;
  suspendedCount: number;
  newSubscribersInPeriod: number;
  byPackage: Array<{
    packageId: string;
    packageName: string;
    speedDesc: string;
    count: number;
  }>;
  byRouter: Array<{
    routerId: string;
    routerName: string;
    count: number;
  }>;
}

export interface AgingBucket {
  count: number;
  totalMinor: number;
}

export interface AgingReportDto {
  totalOutstandingMinor: number;
  totalOverdueCount: number;
  buckets: {
    current: AgingBucket;
    days1to30: AgingBucket;
    days31to60: AgingBucket;
    days61to90: AgingBucket;
    days90Plus: AgingBucket;
  };
  topDebtors: Array<{
    subscriberId: string;
    subscriberName: string;
    accountNumber: string;
    phone: string;
    invoiceCount: number;
    balanceMinor: number;
    oldestDueDate: string;
    daysOverdue: number;
  }>;
}

export interface RouterHealthReportDto {
  totalRouters: number;
  onlineCount: number;
  offlineCount: number;
  avgCpuLoad: number;
  totalSessions: number;
  routers: Array<{
    id: string;
    name: string;
    host: string;
    status: string;
    cpuLoad: number | null;
    memoryFree: number | null;
    memoryTotal: number | null;
    uptime: string | null;
    rosVersion: string | null;
    activeSessions: number;
    lastSeenAt: string | null;
    isStale: boolean;
  }>;
  generatedAt: string;
}

export interface AuditLogQueryDto {
  page?: number;
  limit?: number;
  action?: AuditAction;
  entityType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AuditLogListResultDto {
  items: Array<{
    id: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    details: Record<string, unknown> | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    } | null;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
