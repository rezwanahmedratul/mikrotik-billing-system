import { RouterProtocol } from '@mikrotik-billing/shared';

export interface CreateRouterDto {
  name: string;
  host: string;
  port?: number;
  protocol?: RouterProtocol;
  username: string;
  password: string;
  testImmediately?: boolean;
}

export interface UpdateRouterDto {
  name?: string;
  host?: string;
  port?: number;
  protocol?: RouterProtocol;
  username?: string;
  password?: string;
  isArchived?: boolean;
}

export interface TestRouterConnectionDto {
  host?: string;
  port?: number;
  protocol?: RouterProtocol;
  username?: string;
  password?: string;
}

export interface RouterSummaryResponse {
  id: string;
  tenantId: string;
  name: string;
  host: string;
  port: number;
  protocol: RouterProtocol;
  username: string;
  hasPassword: true;
  connectionStatus: string;
  lastSeenAt: string | null;
  rosVersion: string | null;
  uptime: string | null;
  cpuLoad: number | null;
  memoryFree: number | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  activeSessionsCount?: number;
}
