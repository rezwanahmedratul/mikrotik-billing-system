import { z } from 'zod';

// ==========================================
// User Roles & Authorization
// ==========================================
export enum UserRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  ISP_ADMIN = 'ISP_ADMIN',
  ISP_OPERATOR = 'ISP_OPERATOR',
  CASHIER = 'CASHIER',
  AUDITOR = 'AUDITOR',
}

export const RoleHierarchy: Record<UserRole, number> = {
  [UserRole.PLATFORM_ADMIN]: 100,
  [UserRole.ISP_ADMIN]: 80,
  [UserRole.ISP_OPERATOR]: 50,
  [UserRole.CASHIER]: 30,
  [UserRole.AUDITOR]: 10,
};

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

// ==========================================
// Network & Router Enums
// ==========================================
export enum RouterProtocol {
  REST_HTTPS = 'REST_HTTPS',
  REST_HTTP = 'REST_HTTP',
  API_SSL = 'API_SSL',
  API_PLAIN = 'API_PLAIN',
}

export enum RouterConnectionStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  UNREACHABLE = 'UNREACHABLE',
  AUTH_FAILED = 'AUTH_FAILED',
  DEGRADED = 'DEGRADED',
  UNKNOWN = 'UNKNOWN',
}

export enum RouterJobType {
  CREATE_PPP_SECRET = 'CREATE_PPP_SECRET',
  UPDATE_PPP_SECRET = 'UPDATE_PPP_SECRET',
  DELETE_PPP_SECRET = 'DELETE_PPP_SECRET',
  APPLY_PPP_PROFILE = 'APPLY_PPP_PROFILE',
  SUSPEND_SERVICE = 'SUSPEND_SERVICE',
  RESTORE_SERVICE = 'RESTORE_SERVICE',
  DISCONNECT_ACTIVE_SESSION = 'DISCONNECT_ACTIVE_SESSION',
  SYNC_ROUTER_STATE = 'SYNC_ROUTER_STATE',
}

export enum RouterJobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// ==========================================
// Subscriber & Subscription Enums
// ==========================================
export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  GRACE_PERIOD = 'GRACE_PERIOD',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUALLY = 'SEMI_ANNUALLY',
  ANNUALLY = 'ANNUALLY',
  CUSTOM_DAYS = 'CUSTOM_DAYS',
}

// ==========================================
// Billing, Invoicing & Payments
// ==========================================
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  VOID = 'VOID',
  OVERDUE = 'OVERDUE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  ROCKET = 'ROCKET',
  CARD = 'CARD',
  ONLINE_GATEWAY = 'ONLINE_GATEWAY',
  OTHER = 'OTHER',
}

// ==========================================
// Notifications & SMS
// ==========================================
export enum SmsStatus {
  QUEUED = 'QUEUED',
  SUBMITTED = 'SUBMITTED',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export enum SmsTemplateType {
  INVOICE_ISSUED = 'INVOICE_ISSUED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  DUE_REMINDER = 'DUE_REMINDER',
  SUSPENSION_WARNING = 'SUSPENSION_WARNING',
  SERVICE_SUSPENDED = 'SERVICE_SUSPENDED',
  SERVICE_RESTORED = 'SERVICE_RESTORED',
}

// ==========================================
// Audit Log Actions
// ==========================================
export enum AuditAction {
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  ROUTER_CREATED = 'ROUTER_CREATED',
  ROUTER_UPDATED = 'ROUTER_UPDATED',
  ROUTER_DELETED = 'ROUTER_DELETED',
  PACKAGE_CREATED = 'PACKAGE_CREATED',
  PACKAGE_UPDATED = 'PACKAGE_UPDATED',
  SUBSCRIBER_CREATED = 'SUBSCRIBER_CREATED',
  SUBSCRIBER_UPDATED = 'SUBSCRIBER_UPDATED',
  PPPOE_PROVISIONED = 'PPPOE_PROVISIONED',
  SERVICE_SUSPENDED = 'SERVICE_SUSPENDED',
  SERVICE_RESTORED = 'SERVICE_RESTORED',
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  PAYMENT_RECORDED = 'PAYMENT_RECORDED',
  PAYMENT_REVERSED = 'PAYMENT_REVERSED',
  CONFIG_CHANGED = 'CONFIG_CHANGED',
}

// ==========================================
// Common Validation Schemas
// ==========================================
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Speed validator helper: ensures speeds like "10M/10M" or integer kbps
export const SpeedLimitSchema = z
  .string()
  .regex(
    /^\d+([kKMmGg])?\/\d+([kKMmGg])?$/,
    'Speed limit must be formatted as download/upload rate (e.g., 20M/20M or 10240k/10240k)'
  );

export function parseSpeedStringToKbps(speedStr: string): number {
  const match = speedStr.trim().match(/^(\d+)([kKMmGg])?$/);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = (match[2] || 'k').toUpperCase();

  if (unit === 'G') return value * 1024 * 1024;
  if (unit === 'M') return value * 1024;
  return value;
}

export function formatSpeedKbps(kbps: number): string {
  if (kbps >= 1024 * 1024) {
    return `${(kbps / (1024 * 1024)).toFixed(0)}G`;
  }
  if (kbps >= 1024) {
    return `${(kbps / 1024).toFixed(0)}M`;
  }
  return `${kbps}k`;
}

// Currency minor unit formatting utility (integers to formatted display)
export function formatCurrency(minorUnits: number, currency = 'BDT'): string {
  const amount = (minorUnits / 100).toFixed(2);
  return `${currency} ${amount}`;
}

export function parseCurrencyToMinor(majorUnits: number | string): number {
  const num = typeof majorUnits === 'string' ? parseFloat(majorUnits) : majorUnits;
  return Math.round(num * 100);
}

export function formatBytes(bytes: number | bigint | null | undefined): string {
  if (bytes === null || bytes === undefined) return '0 B';
  const num = typeof bytes === 'bigint' ? Number(bytes) : bytes;
  if (num <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(num) / Math.log(1024)));
  const val = num / Math.pow(1024, i);
  return `${val.toFixed(val >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export * from './encryption';
export * from './router-adapter';
export * from './mock-router-adapter';
export * from './payment-gateway.interface';
export * from './mock-payment-gateway-adapter';
export * from './sms.interface';
export * from './mock-sms-adapter';

