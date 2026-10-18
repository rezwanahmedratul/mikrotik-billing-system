export interface TenantSettingsData {
  id: string;
  name: string;
  slug: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  currency: string;
  invoiceDueDays: number;
  gracePeriodDays: number;
  autoSuspensionEnabled: boolean;
  smsAlertsEnabled: boolean;
  defaultPppoeProfile: string;
  bkashMerchantConfigured: boolean;
  nagadMerchantConfigured: boolean;
  sslcommerzConfigured: boolean;
  smsGatewayConfigured: boolean;
  routerOsApiPort: number;
}

export interface SystemStatusData {
  apiStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  dbStatus: 'CONNECTED' | 'DISCONNECTED';
  redisStatus: 'CONNECTED' | 'DISCONNECTED';
  workerStatus: 'ACTIVE' | 'IDLE';
  activeRoutersCount: number;
  activeSubscribersCount: number;
  platformVersion: string;
  environment: string;
}
