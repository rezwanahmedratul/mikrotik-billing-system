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
  RouterAuthError,
  RouterTimeoutError,
  RouterUnreachableError,
  RouterExecutionError,
} from '@mikrotik-billing/shared';

export class RouterOsAdapter implements RouterAdapter {
  private getBaseUrl(config: RouterConnectionConfig): string {
    const isSsl = config.protocol === 'REST_HTTPS' || config.protocol === 'API_SSL';
    const protocol = isSsl ? 'https' : 'http';
    return `${protocol}://${config.host}:${config.port}/rest`;
  }

  private async request<T = any>(
    config: RouterConnectionConfig,
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.getBaseUrl(config)}${endpoint}`;
    const timeoutMs = config.timeoutMs || 6000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const authHeader =
      'Basic ' + Buffer.from(`${config.username}:${config.password}`).toString('base64');

    const headers: Record<string, string> = {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (res.status === 401 || res.status === 403) {
        throw new RouterAuthError(`Router authentication failed for user '${config.username}'.`);
      }

      if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        throw new RouterExecutionError(
          `Router returned HTTP error ${res.status}: ${errorBody || res.statusText}`,
          { status: res.status, body: errorBody }
        );
      }

      const json = await res.json().catch(() => null);
      return json as T;
    } catch (err: any) {
      if (err instanceof RouterAuthError || err instanceof RouterExecutionError) {
        throw err;
      }

      if (err.name === 'AbortError') {
        throw new RouterTimeoutError(`Connection to router timed out after ${timeoutMs}ms.`);
      }

      const msg = err.message || '';
      if (
        msg.includes('ECONNREFUSED') ||
        msg.includes('ENOTFOUND') ||
        msg.includes('EHOSTUNREACH') ||
        msg.includes('fetch failed')
      ) {
        throw new RouterUnreachableError(
          `Unable to connect to router at ${config.host}:${config.port}: ${msg}`
        );
      }

      throw new RouterExecutionError(`Router communication failure: ${msg}`, { originalError: err });
    } finally {
      clearTimeout(timer);
    }
  }

  async testConnection(config: RouterConnectionConfig): Promise<ConnectionTestResult> {
    const start = Date.now();
    try {
      const [identityData, resourceData] = await Promise.all([
        this.request<any>(config, '/system/identity'),
        this.request<any>(config, '/system/resource'),
      ]);

      const latencyMs = Date.now() - start;

      return {
        success: true,
        latencyMs,
        identity: identityData?.name || identityData?.[0]?.name || 'RouterOS',
        rosVersion: resourceData?.version || resourceData?.[0]?.version || '7.x',
        boardName: resourceData?.['board-name'] || resourceData?.[0]?.['board-name'] || 'RouterBOARD',
        uptime: resourceData?.uptime || resourceData?.[0]?.uptime || '0s',
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      return {
        success: false,
        latencyMs,
        error: err.message || 'Unknown router connection failure',
      };
    }
  }

  async getHealth(config: RouterConnectionConfig): Promise<RouterHealthSnapshot> {
    const [identityData, resourceData, activeData] = await Promise.all([
      this.request<any>(config, '/system/identity').catch(() => ({})),
      this.request<any>(config, '/system/resource'),
      this.request<any[]>(config, '/ppp/active').catch(() => []),
    ]);

    const resource = Array.isArray(resourceData) ? resourceData[0] : resourceData;
    const identity = Array.isArray(identityData) ? identityData[0] : identityData;
    const activeList = Array.isArray(activeData) ? activeData : [];

    const cpuLoad = parseInt(resource?.['cpu-load'] || '0', 10);
    const freeMemoryBytes = parseInt(resource?.['free-memory'] || '0', 10);
    const totalMemoryBytes = parseInt(resource?.['total-memory'] || '0', 10);
    const freeHddBytes = parseInt(resource?.['free-hdd-space'] || '0', 10);
    const totalHddBytes = parseInt(resource?.['total-hdd-space'] || '0', 10);

    return {
      identity: identity?.name || 'RouterOS',
      rosVersion: resource?.version || '7.x',
      boardName: resource?.['board-name'] || 'RouterBOARD',
      cpuLoad: isNaN(cpuLoad) ? 0 : cpuLoad,
      cpuCount: parseInt(resource?.['cpu-count'] || '1', 10),
      freeMemoryBytes: isNaN(freeMemoryBytes) ? 0 : freeMemoryBytes,
      totalMemoryBytes: isNaN(totalMemoryBytes) ? 1024 * 1024 * 1024 : totalMemoryBytes,
      freeHddBytes: isNaN(freeHddBytes) ? 0 : freeHddBytes,
      totalHddBytes: isNaN(totalHddBytes) ? 0 : totalHddBytes,
      uptime: resource?.uptime || '0s',
      activeSessionsCount: activeList.length,
      timestamp: new Date(),
    };
  }

  async getInterfaces(config: RouterConnectionConfig): Promise<RouterInterface[]> {
    const list = await this.request<any[]>(config, '/interface');
    if (!Array.isArray(list)) return [];

    return list.map((item) => ({
      name: item.name,
      type: item.type,
      macAddress: item['mac-address'],
      running: item.running === 'true' || item.running === true,
      disabled: item.disabled === 'true' || item.disabled === true,
      comment: item.comment,
    }));
  }

  async getPppoeProfiles(config: RouterConnectionConfig): Promise<PppoeProfile[]> {
    const list = await this.request<any[]>(config, '/ppp/profile');
    if (!Array.isArray(list)) return [];

    return list.map((item) => ({
      id: item['.id'],
      name: item.name,
      localAddress: item['local-address'],
      remoteAddress: item['remote-address'],
      rateLimit: item['rate-limit'],
      dnsServer: item['dns-server'],
      onlyOne: item['only-one'],
      comment: item.comment,
    }));
  }

  async upsertPppoeProfile(
    config: RouterConnectionConfig,
    profile: PppoeProfileInput
  ): Promise<PppoeProfile> {
    const existingList = await this.getPppoeProfiles(config);
    const existing = existingList.find((p) => p.name === profile.name);

    const body: Record<string, any> = {
      name: profile.name,
    };
    if (profile.localAddress) body['local-address'] = profile.localAddress;
    if (profile.remoteAddress) body['remote-address'] = profile.remoteAddress;
    if (profile.rateLimit) body['rate-limit'] = profile.rateLimit;
    if (profile.dnsServer) body['dns-server'] = profile.dnsServer;
    if (profile.onlyOne) body['only-one'] = profile.onlyOne;
    if (profile.comment) body['comment'] = profile.comment;

    if (existing?.id) {
      await this.request(config, `/ppp/profile/${existing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      return { id: existing.id, ...profile };
    } else {
      const created = await this.request(config, '/ppp/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      return { id: created?.['.id'], ...profile };
    }
  }

  async getPppoeSecrets(config: RouterConnectionConfig): Promise<PppoeSecret[]> {
    const list = await this.request<any[]>(config, '/ppp/secret');
    if (!Array.isArray(list)) return [];

    return list.map((item) => ({
      id: item['.id'],
      name: item.name,
      password: item.password || '',
      profile: item.profile,
      service: item.service,
      callerId: item['caller-id'],
      remoteAddress: item['remote-address'],
      disabled: item.disabled === 'true' || item.disabled === true,
      comment: item.comment,
    }));
  }

  async upsertPppoeSecret(
    config: RouterConnectionConfig,
    secret: PppoeSecretInput
  ): Promise<PppoeSecret> {
    const existingList = await this.getPppoeSecrets(config);
    const existing = existingList.find((s) => s.name === secret.name);

    const body: Record<string, any> = {
      name: secret.name,
      password: secret.password,
      profile: secret.profile,
      service: secret.service || 'pppoe',
      disabled: secret.disabled ? 'yes' : 'no',
    };
    if (secret.callerId) body['caller-id'] = secret.callerId;
    if (secret.remoteAddress) body['remote-address'] = secret.remoteAddress;
    if (secret.comment) body['comment'] = secret.comment;

    if (existing?.id) {
      await this.request(config, `/ppp/secret/${existing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      return { id: existing.id, ...secret };
    } else {
      const created = await this.request(config, '/ppp/secret', {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      return { id: created?.['.id'], ...secret };
    }
  }

  async deletePppoeSecret(config: RouterConnectionConfig, username: string): Promise<boolean> {
    const existingList = await this.getPppoeSecrets(config);
    const existing = existingList.find((s) => s.name === username);
    if (!existing || !existing.id) {
      return true;
    }

    await this.request(config, `/ppp/secret/${existing.id}`, {
      method: 'DELETE',
    });
    return true;
  }

  async getActiveSessions(config: RouterConnectionConfig): Promise<ActiveSession[]> {
    const list = await this.request<any[]>(config, '/ppp/active');
    if (!Array.isArray(list)) return [];

    return list.map((item) => ({
      id: item['.id'],
      username: item.name,
      service: item.service,
      callerId: item['caller-id'],
      address: item.address,
      uptime: item.uptime || '0s',
      bytesIn: parseInt(item['bytes-in'] || '0', 10),
      bytesOut: parseInt(item['bytes-out'] || '0', 10),
      sessionId: item['session-id'],
    }));
  }

  async disconnectSession(
    config: RouterConnectionConfig,
    usernameOrSessionId: string
  ): Promise<boolean> {
    const sessions = await this.getActiveSessions(config);
    const target = sessions.find(
      (s) => s.username === usernameOrSessionId || s.id === usernameOrSessionId
    );

    if (target && target.id) {
      await this.request(config, `/ppp/active/${target.id}`, {
        method: 'DELETE',
      });
      return true;
    }
    return true;
  }
}
