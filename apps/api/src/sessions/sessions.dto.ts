export interface SessionQueryDto {
  routerId?: string;
  search?: string; // username, IP, MAC
  live?: boolean; // if true, forces fresh router poll; else allows cached snapshots
}

export interface SessionItemResponse {
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

export interface RouterSessionHealth {
  routerId: string;
  routerName: string;
  host: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  activeSessionsCount: number;
  lastSyncAt: string;
  error?: string;
}

export interface SessionsListResponse {
  sessions: SessionItemResponse[];
  routersHealth: RouterSessionHealth[];
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

export interface DisconnectSessionDto {
  routerId: string;
  username: string;
  reason?: string;
}
