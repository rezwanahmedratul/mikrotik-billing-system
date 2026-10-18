import { describe, it, expect, beforeEach } from 'vitest';
import { MockRouterAdapter } from './mock-router-adapter';
import {
  RouterProtocol,
  RouterAuthError,
  RouterTimeoutError,
  RouterUnreachableError,
} from './index';

describe('MockRouterAdapter', () => {
  let adapter: MockRouterAdapter;

  beforeEach(() => {
    adapter = new MockRouterAdapter();
  });

  const baseConfig = {
    host: '192.168.88.1',
    port: 8728,
    protocol: RouterProtocol.REST_HTTPS,
    username: 'admin',
    password: 'CorrectPass123!',
  };

  it('connects successfully and returns identity and hardware specs', async () => {
    const result = await adapter.testConnection(baseConfig);
    expect(result.success).toBe(true);
    expect(result.identity).toBe('FastNet-Core-CCR2004');
    expect(result.rosVersion).toBe('7.14.3');
    expect(result.boardName).toBe('CCR2004-16G-2S+');
    expect(result.latencyMs).toBeGreaterThan(0);
  });

  it('rejects connection with RouterAuthError when password is invalid', async () => {
    await expect(
      adapter.testConnection({ ...baseConfig, password: 'badpass' })
    ).rejects.toThrow(RouterAuthError);
  });

  it('simulates timeout when host is timeout.local', async () => {
    await expect(
      adapter.testConnection({ ...baseConfig, host: 'timeout.local' })
    ).rejects.toThrow(RouterTimeoutError);
  });

  it('simulates unreachable network when host is unreachable.local', async () => {
    await expect(
      adapter.testConnection({ ...baseConfig, host: 'unreachable.local' })
    ).rejects.toThrow(RouterUnreachableError);
  });

  it('collects realistic system health telemetry', async () => {
    const health = await adapter.getHealth(baseConfig);
    expect(health.cpuLoad).toBe(18);
    expect(health.totalMemoryBytes).toBeGreaterThan(health.freeMemoryBytes);
    expect(health.uptime).toBe('14d 06:12:00');
    expect(health.activeSessionsCount).toBe(2);
    expect(health.timestamp).toBeInstanceOf(Date);
  });

  it('manages PPPoE secrets (get, upsert, delete)', async () => {
    const secrets = await adapter.getPppoeSecrets(baseConfig);
    expect(secrets.length).toBe(2);

    // Add new secret
    await adapter.upsertPppoeSecret(baseConfig, {
      name: 'user-new',
      password: 'NewSecretPass123!',
      profile: 'Starter-20M',
      service: 'pppoe',
      remoteAddress: '10.10.20.99',
    });

    const updatedSecrets = await adapter.getPppoeSecrets(baseConfig);
    expect(updatedSecrets.length).toBe(3);
    expect(updatedSecrets.some((s) => s.name === 'user-new')).toBe(true);

    // Delete secret
    await adapter.deletePppoeSecret(baseConfig, 'user-new');
    const finalSecrets = await adapter.getPppoeSecrets(baseConfig);
    expect(finalSecrets.length).toBe(2);
    expect(finalSecrets.some((s) => s.name === 'user-new')).toBe(false);
  });

  it('fetches active PPPoE sessions and terminates active session', async () => {
    const sessions = await adapter.getActiveSessions(baseConfig);
    expect(sessions.length).toBe(2);

    const targetUser = sessions[0].username;
    const disconnected = await adapter.disconnectSession(baseConfig, targetUser);
    expect(disconnected).toBe(true);

    const remainingSessions = await adapter.getActiveSessions(baseConfig);
    expect(remainingSessions.length).toBe(1);
    expect(remainingSessions.some((s) => s.username === targetUser)).toBe(false);
  });
});
