import { BillingCycle } from '@mikrotik-billing/shared';

export interface CreatePackageDto {
  name: string;
  code?: string;
  speedLimitRaw: string; // e.g. "20M/20M" (upload/download in RouterOS format or download/upload)
  price?: number; // In major currency units, e.g. 800
  priceMinor?: number; // In minor units, e.g. 80000
  billingCycle?: BillingCycle;
  validityDays?: number;
  pppProfileName?: string;
  description?: string;
}

export interface UpdatePackageDto {
  name?: string;
  speedLimitRaw?: string;
  price?: number;
  priceMinor?: number;
  billingCycle?: BillingCycle;
  validityDays?: number;
  pppProfileName?: string;
  description?: string;
  isArchived?: boolean;
  propagateToActiveSubscriptions?: boolean;
}

export interface PackageResponse {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  downloadSpeedKbps: number;
  uploadSpeedKbps: number;
  speedLimitRaw: string;
  priceMinor: number;
  priceFormatted: string;
  billingCycle: BillingCycle;
  validityDays: number;
  pppProfileName: string;
  description: string | null;
  isArchived: boolean;
  activeSubscriptionsCount: number;
  createdAt: string;
  updatedAt: string;
}
