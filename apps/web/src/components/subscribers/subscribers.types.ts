export interface SubscriptionInfo {
  id: string;
  packageId: string;
  packageName: string;
  speedLimitRaw: string;
  priceMinor: number;
  priceFormatted: string;
  billingCycle: string;
  routerId: string;
  routerName: string;
  status: string;
  startDate: string;
  expiryDate: string;
  isAutoRenew: boolean;
  daysRemaining: number;
}

export interface PppoeAccountInfo {
  id: string;
  routerId: string;
  routerName: string;
  username: string;
  hasPassword: true;
  pppProfile: string;
  staticIp?: string | null;
  callerId?: string | null;
  isSuspended: boolean;
  confirmedOnRouter: boolean;
  lastProvisionedAt?: string | null;
}

export interface ServiceEventInfo {
  id: string;
  type: string;
  reason?: string | null;
  initiatedBy?: string | null;
  createdAt: string;
}

export interface SubscriberItem {
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
  currentSubscription?: SubscriptionInfo | null;
  pppoeAccount?: PppoeAccountInfo | null;
}

export interface SubscriberDetail extends SubscriberItem {
  subscriptions: SubscriptionInfo[];
  serviceEvents: ServiceEventInfo[];
  invoicesCount: number;
  paymentsCount: number;
  outstandingBalanceMinor: number;
}

export interface CreateSubscriberFormData {
  fullName: string;
  phone: string;
  email?: string;
  nidOrPassport?: string;
  address?: string;
  billingAddress?: string;
  packageId: string;
  routerId: string;
  pppoeUsername?: string;
  pppoePassword?: string;
  staticIp?: string;
  callerId?: string;
}
