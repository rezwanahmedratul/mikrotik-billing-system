export interface PackageItem {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  downloadSpeedKbps: number;
  uploadSpeedKbps: number;
  speedLimitRaw: string;
  priceMinor: number;
  priceFormatted: string;
  billingCycle: string;
  validityDays: number;
  pppProfileName: string;
  description: string | null;
  isArchived: boolean;
  activeSubscriptionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PackageFormData {
  name: string;
  code?: string;
  speedLimitRaw: string;
  priceMinor: number;
  billingCycle: string;
  validityDays: number;
  pppProfileName: string;
  description?: string;
  propagateToActiveSubscriptions?: boolean;
}
