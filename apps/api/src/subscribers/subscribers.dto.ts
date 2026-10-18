import {
  SubscriptionStatus,
  BillingCycle,
} from '@mikrotik-billing/shared';

export interface CreateSubscriberDto {
  fullName: string;
  phone: string;
  email?: string;
  nidOrPassport?: string;
  address?: string;
  billingAddress?: string;
  // Subscription & Network provisioning
  packageId: string;
  routerId: string;
  startDate?: string;
  expiryDays?: number;
  isAutoRenew?: boolean;
  // PPPoE Secret credentials
  pppoeUsername?: string;
  pppoePassword?: string;
  staticIp?: string;
  callerId?: string;
}

export interface UpdateSubscriberDto {
  fullName?: string;
  phone?: string;
  email?: string;
  nidOrPassport?: string;
  address?: string;
  billingAddress?: string;
}

export interface ChangeServiceStatusDto {
  status: 'SUSPENDED' | 'ACTIVE';
  reason?: string;
}

export interface ChangePackageDto {
  packageId: string;
  applyImmediately?: boolean;
}

export interface RenewSubscriptionDto {
  extensionDays?: number;
  notes?: string;
}

export interface SubscriberQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: SubscriptionStatus;
  routerId?: string;
  packageId?: string;
  isArchived?: boolean;
}

export interface PppoeAccountResponse {
  id: string;
  routerId: string;
  routerName: string;
  username: string;
  hasPassword: true; // NEVER return the plain password
  pppProfile: string;
  staticIp?: string | null;
  callerId?: string | null;
  isSuspended: boolean;
  confirmedOnRouter: boolean;
  lastProvisionedAt?: string | null;
}

export interface SubscriptionResponse {
  id: string;
  packageId: string;
  packageName: string;
  speedLimitRaw: string;
  priceMinor: number;
  priceFormatted: string;
  billingCycle: BillingCycle;
  routerId: string;
  routerName: string;
  status: SubscriptionStatus;
  startDate: string;
  expiryDate: string;
  isAutoRenew: boolean;
  daysRemaining: number;
}

export interface ServiceEventResponse {
  id: string;
  type: string;
  reason?: string | null;
  initiatedBy?: string | null;
  createdAt: string;
}

export interface SubscriberResponse {
  id: string;
  tenantId: string;
  accountNumber: string;
  fullName: string;
  phone: string;
  email?: string | null;
  nidOrPassport?: string | null;
  address?: string | null;
  billingAddress?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  currentSubscription?: SubscriptionResponse | null;
  pppoeAccount?: PppoeAccountResponse | null;
}

export interface SubscriberDetailResponse extends SubscriberResponse {
  subscriptions: SubscriptionResponse[];
  serviceEvents: ServiceEventResponse[];
  invoicesCount: number;
  paymentsCount: number;
  outstandingBalanceMinor: number;
}

export interface PaginatedSubscribersResponse {
  data: SubscriberResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
