export interface RouterItem {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: string;
  username: string;
  connectionStatus: string;
  lastSeenAt: string | null;
  rosVersion: string | null;
  uptime: string | null;
  cpuLoad: number | null;
  memoryFree: number | null;
  isArchived: boolean;
  activeSessionsCount?: number;
}

export interface TestResult {
  success: boolean;
  latencyMs: number;
  identity?: string;
  rosVersion?: string;
  boardName?: string;
  uptime?: string;
  error?: string;
}
