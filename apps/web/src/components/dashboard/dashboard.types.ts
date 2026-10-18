export interface RouterSummary {
  id: string;
  name: string;
  ipAddress: string;
  status: 'ONLINE' | 'OFFLINE' | 'WARNING';
  cpuUsage: number;
  memoryUsage: number;
  activeSessions: number;
  lastSeen: string;
}

export interface RecentActivity {
  id: string;
  action: string;
  entityType: string;
  user: string;
  timestamp: string;
}

export interface DashboardMetrics {
  activeSubscribers: number;
  subscribersDelta: string;
  onlineSessions: number;
  onlineRoutersCount: number;
  totalRoutersCount: number;
  currentMonthBilledFormatted: string;
  currentMonthPaidFormatted: string;
  collectionRate: string;
}
