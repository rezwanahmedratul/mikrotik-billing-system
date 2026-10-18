import {
  RouterAdapter,
  RouterConnectionConfig,
  ConnectionTestResult,
  RouterHealthSnapshot,
  RouterInterface,
  PppoeProfile,
  PppoeProfileInput,
  PppoeSecret,
  PppoeSecretInput,
  ActiveSession,
  IpPool,
  PppoeServer,
  RouterAuthError,
  RouterTimeoutError,
  RouterUnreachableError,
} from './router-adapter';

export class MockRouterAdapter implements RouterAdapter {
  private profiles: Map<string, PppoeProfile> = new Map([
    [
      'default',
      {
        id: '*1',
        name: 'default',
        rateLimit: '10M/10M',
        onlyOne: 'yes',
        comment: 'Default PPP profile',
      },
    ],
    [
      'Starter-20M',
      {
        id: '*2',
        name: 'Starter-20M',
        rateLimit: '20M/20M',
        remoteAddress: 'pppoe-pool-1',
        onlyOne: 'yes',
        comment: '20Mbps residential profile',
      },
    ],
    [
      'Business-50M',
      {
        id: '*3',
        name: 'Business-50M',
        rateLimit: '50M/50M',
        remoteAddress: 'pppoe-pool-1',
        onlyOne: 'yes',
        comment: '50Mbps business profile',
      },
    ],
  ]);

  private ipPools: Map<string, IpPool> = new Map([
    [
      'pppoe-pool-1',
      {
        id: '*pool1',
        name: 'pppoe-pool-1',
        ranges: '10.10.20.2-10.10.20.254',
        comment: 'Default subscriber dynamic pool',
      },
    ],
  ]);

  private pppoeServers: Map<string, PppoeServer> = new Map([
    [
      'pppoe-in-lan',
      {
        id: '*srv1',
        serviceName: 'pppoe-in-lan',
        interfaceName: 'ether2-lan',
        defaultProfile: 'default',
        oneSessionPerHost: true,
        maxMtu: 1480,
        maxMru: 1480,
        disabled: false,
      },
    ],
  ]);

  private secrets: Map<string, PppoeSecret> = new Map([
    [
      'user-rahim',
      {
        id: '*s1',
        name: 'user-rahim',
        password: 'UserPass123!',
        profile: 'Starter-20M',
        service: 'pppoe',
        callerId: '00:1A:2B:3C:4D:5E',
        remoteAddress: '10.10.20.14',
        disabled: false,
      },
    ],
    [
      'user-karim',
      {
        id: '*s2',
        name: 'user-karim',
        password: 'UserPass456!',
        profile: 'Business-50M',
        service: 'pppoe',
        callerId: '00:1A:2B:3C:4D:5F',
        remoteAddress: '10.10.20.15',
        disabled: false,
      },
    ],
  ]);

  private activeSessions: Map<string, ActiveSession> = new Map([
    [
      'user-rahim',
      {
        id: '*a1',
        username: 'user-rahim',
        service: 'pppoe',
        callerId: '00:1A:2B:3C:4D:5E',
        address: '10.10.20.14',
        uptime: '3d 14:22:10',
        bytesIn: 452914800,
        bytesOut: 1845920300,
        sessionId: 'sess-84920',
      },
    ],
    [
      'user-karim',
      {
        id: '*a2',
        username: 'user-karim',
        service: 'pppoe',
        callerId: '00:1A:2B:3C:4D:5F',
        address: '10.10.20.15',
        uptime: '1d 08:45:00',
        bytesIn: 840293000,
        bytesOut: 3958102000,
        sessionId: 'sess-84921',
      },
    ],
  ]);

  private checkFailureTriggers(config: RouterConnectionConfig) {
    if (config.password === 'badpass' || config.password === 'invalid_password') {
      throw new RouterAuthError('Router authentication failed: Invalid credentials provided.');
    }
    if (config.host === 'timeout.local' || config.host === '192.0.2.1') {
      throw new RouterTimeoutError('Router connection timed out after 5000ms.');
    }
    if (config.host === 'unreachable.local' || config.host === '192.0.2.2') {
      throw new RouterUnreachableError(
        'Router host unreachable: connect ECONNREFUSED 192.0.2.2:8728'
      );
    }
  }

  async testConnection(config: RouterConnectionConfig): Promise<ConnectionTestResult> {
    this.checkFailureTriggers(config);

    return {
      success: true,
      latencyMs: 14,
      identity: config.host.includes('pop') ? 'FastNet-POP-RB4011' : 'FastNet-Core-CCR2004',
      rosVersion: '7.14.3',
      boardName: config.host.includes('pop') ? 'RB4011iGS+' : 'CCR2004-16G-2S+',
      uptime: '14d 06:12:00',
    };
  }

  async getHealth(config: RouterConnectionConfig): Promise<RouterHealthSnapshot> {
    this.checkFailureTriggers(config);

    const isDegraded = config.host === 'degraded.local';

    return {
      identity: config.host.includes('pop') ? 'FastNet-POP-RB4011' : 'FastNet-Core-CCR2004',
      rosVersion: '7.14.3',
      boardName: config.host.includes('pop') ? 'RB4011iGS+' : 'CCR2004-16G-2S+',
      cpuLoad: isDegraded ? 94 : 18,
      cpuCount: 4,
      freeMemoryBytes: isDegraded ? 48 * 1024 * 1024 : 1240 * 1024 * 1024,
      totalMemoryBytes: 2048 * 1024 * 1024,
      freeHddBytes: 110 * 1024 * 1024,
      totalHddBytes: 128 * 1024 * 1024,
      uptime: '14d 06:12:00',
      activeSessionsCount: this.activeSessions.size,
      timestamp: new Date(),
    };
  }

  async getInterfaces(config: RouterConnectionConfig): Promise<RouterInterface[]> {
    this.checkFailureTriggers(config);

    return [
      {
        name: 'ether1-wan',
        type: 'ether',
        macAddress: '48:8F:5A:01:02:03',
        running: true,
        disabled: false,
        comment: 'Upstream Uplink 1Gbps',
      },
      {
        name: 'ether2-lan',
        type: 'ether',
        macAddress: '48:8F:5A:01:02:04',
        running: true,
        disabled: false,
        comment: 'Distribution Switch Trunk',
      },
      {
        name: 'sfp-plus1',
        type: 'sfp-sfpplus',
        macAddress: '48:8F:5A:01:02:05',
        running: true,
        disabled: false,
        comment: '10G Metro Ring',
      },
    ];
  }

  async getPppoeProfiles(config: RouterConnectionConfig): Promise<PppoeProfile[]> {
    this.checkFailureTriggers(config);
    return Array.from(this.profiles.values());
  }

  async upsertPppoeProfile(
    config: RouterConnectionConfig,
    profile: PppoeProfileInput
  ): Promise<PppoeProfile> {
    this.checkFailureTriggers(config);

    const existing = this.profiles.get(profile.name);
    const updated: PppoeProfile = {
      id: existing?.id || `*prof-${Date.now()}`,
      ...profile,
    };
    this.profiles.set(profile.name, updated);
    return updated;
  }

  async getPppoeSecrets(config: RouterConnectionConfig): Promise<PppoeSecret[]> {
    this.checkFailureTriggers(config);
    return Array.from(this.secrets.values());
  }

  async upsertPppoeSecret(
    config: RouterConnectionConfig,
    secret: PppoeSecretInput
  ): Promise<PppoeSecret> {
    this.checkFailureTriggers(config);

    const existing = this.secrets.get(secret.name);
    const updated: PppoeSecret = {
      id: existing?.id || `*sec-${Date.now()}`,
      ...secret,
    };
    this.secrets.set(secret.name, updated);
    return updated;
  }

  async deletePppoeSecret(config: RouterConnectionConfig, username: string): Promise<boolean> {
    this.checkFailureTriggers(config);
    this.secrets.delete(username);
    this.activeSessions.delete(username);
    return true;
  }

  async getActiveSessions(config: RouterConnectionConfig): Promise<ActiveSession[]> {
    this.checkFailureTriggers(config);
    return Array.from(this.activeSessions.values());
  }

  async disconnectSession(
    config: RouterConnectionConfig,
    usernameOrSessionId: string
  ): Promise<boolean> {
    this.checkFailureTriggers(config);

    for (const [key, session] of this.activeSessions.entries()) {
      if (session.username === usernameOrSessionId || session.id === usernameOrSessionId) {
        this.activeSessions.delete(key);
        return true;
      }
    }
    return true;
  }

  async getIpPools(config: RouterConnectionConfig): Promise<IpPool[]> {
    this.checkFailureTriggers(config);
    return Array.from(this.ipPools.values());
  }

  async upsertIpPool(config: RouterConnectionConfig, pool: IpPool): Promise<IpPool> {
    this.checkFailureTriggers(config);
    const existing = this.ipPools.get(pool.name);
    const updated: IpPool = {
      id: existing?.id || `*pool-${Date.now()}`,
      ...pool,
    };
    this.ipPools.set(pool.name, updated);
    return updated;
  }

  async getPppoeServers(config: RouterConnectionConfig): Promise<PppoeServer[]> {
    this.checkFailureTriggers(config);
    return Array.from(this.pppoeServers.values());
  }

  async upsertPppoeServer(config: RouterConnectionConfig, server: PppoeServer): Promise<PppoeServer> {
    this.checkFailureTriggers(config);
    const existing = this.pppoeServers.get(server.serviceName);
    const updated: PppoeServer = {
      id: existing?.id || `*srv-${Date.now()}`,
      ...server,
    };
    this.pppoeServers.set(server.serviceName, updated);
    return updated;
  }
}
