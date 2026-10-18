import { RouterProtocol } from './index';

export class RouterError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code = 'ROUTER_ERROR', details?: any) {
    super(message);
    this.name = 'RouterError';
    this.code = code;
    this.details = details;
  }
}

export class RouterAuthError extends RouterError {
  constructor(message = 'Router authentication failed. Invalid username or password.') {
    super(message, 'ROUTER_AUTH_FAILED');
    this.name = 'RouterAuthError';
  }
}

export class RouterTimeoutError extends RouterError {
  constructor(message = 'Router connection timed out.') {
    super(message, 'ROUTER_TIMEOUT');
    this.name = 'RouterTimeoutError';
  }
}

export class RouterUnreachableError extends RouterError {
  constructor(message = 'Router host is unreachable or connection was refused.') {
    super(message, 'ROUTER_UNREACHABLE');
    this.name = 'RouterUnreachableError';
  }
}

export class RouterExecutionError extends RouterError {
  constructor(message: string, details?: any) {
    super(message, 'ROUTER_EXECUTION_ERROR', details);
    this.name = 'RouterExecutionError';
  }
}

export interface RouterConnectionConfig {
  host: string;
  port: number;
  protocol: RouterProtocol;
  username: string;
  password: string;
  timeoutMs?: number;
  insecureSkipVerify?: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  identity?: string;
  rosVersion?: string;
  boardName?: string;
  uptime?: string;
  error?: string;
}

export interface RouterHealthSnapshot {
  identity: string;
  rosVersion: string;
  boardName: string;
  cpuLoad: number; // 0 - 100%
  cpuCount?: number;
  freeMemoryBytes: number;
  totalMemoryBytes: number;
  freeHddBytes?: number;
  totalHddBytes?: number;
  uptime: string;
  activeSessionsCount: number;
  timestamp: Date;
}

export interface RouterInterface {
  name: string;
  type: string;
  macAddress?: string;
  running: boolean;
  disabled: boolean;
  comment?: string;
}

export interface PppoeProfileInput {
  name: string;
  localAddress?: string;
  remoteAddress?: string; // pool name or IP
  rateLimit?: string; // e.g. "20M/20M"
  dnsServer?: string;
  onlyOne?: 'yes' | 'no' | 'default';
  comment?: string;
}

export interface PppoeProfile extends PppoeProfileInput {
  id?: string;
}

export interface PppoeSecretInput {
  name: string; // username
  password: string;
  profile: string;
  service?: string; // default 'pppoe'
  callerId?: string; // MAC lock
  remoteAddress?: string; // static IP
  disabled?: boolean;
  comment?: string;
}

export interface PppoeSecret extends PppoeSecretInput {
  id?: string;
}

export interface ActiveSession {
  id: string;
  username: string;
  service: string;
  callerId?: string; // client MAC
  address: string; // assigned client IP
  uptime: string;
  bytesIn: number; // upload bytes
  bytesOut: number; // download bytes
  sessionId?: string;
}

export interface RouterAdapter {
  testConnection(config: RouterConnectionConfig): Promise<ConnectionTestResult>;
  getHealth(config: RouterConnectionConfig): Promise<RouterHealthSnapshot>;
  getInterfaces(config: RouterConnectionConfig): Promise<RouterInterface[]>;
  getPppoeProfiles(config: RouterConnectionConfig): Promise<PppoeProfile[]>;
  upsertPppoeProfile(config: RouterConnectionConfig, profile: PppoeProfileInput): Promise<PppoeProfile>;
  getPppoeSecrets(config: RouterConnectionConfig): Promise<PppoeSecret[]>;
  upsertPppoeSecret(config: RouterConnectionConfig, secret: PppoeSecretInput): Promise<PppoeSecret>;
  deletePppoeSecret(config: RouterConnectionConfig, username: string): Promise<boolean>;
  getActiveSessions(config: RouterConnectionConfig): Promise<ActiveSession[]>;
  disconnectSession(config: RouterConnectionConfig, usernameOrSessionId: string): Promise<boolean>;
}
