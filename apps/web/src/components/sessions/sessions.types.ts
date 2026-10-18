export interface SessionItem {
  id: string;
  username: string;
  subscriberId?: string | null;
  subscriberName?: string | null;
  accountNumber?: string | null;
  packageName?: string | null;
  speedLimitRaw?: string | null;
  routerId: string;
  routerName: string;
  service: string;
  callerId?: string | null;
  ipAddress?: string | null;
  uptime: string;
  bytesIn: number;
  bytesOut: number;
  formattedRx: string;
  formattedTx: string;
  sessionId?: string | null;
  isStale: boolean;
  observedAt: string;
}

export interface RouterHealthItem {
  routerId: string;
  routerName: string;
  host: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  activeSessionsCount: number;
  lastSyncAt: string;
  error?: string;
}

export interface SessionsResponseData {
  sessions: SessionItem[];
  routersHealth: RouterHealthItem[];
  meta: {
    totalSessions: number;
    totalRxBytes: number;
    totalTxBytes: number;
    formattedTotalRx: string;
    formattedTotalTx: string;
    lastPolledAt: string;
    freshnessNote: string;
  };
}
