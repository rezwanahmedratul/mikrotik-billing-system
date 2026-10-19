import { describe, it, expect, vi } from 'vitest';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  const controller = new HealthController();

  it('returns ok for root health probe', () => {
    const health = controller.getHealth();
    expect(health.status).toBe('ok');
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(health.timestamp).toBeDefined();
  });

  it('returns ok for liveness probe', () => {
    const live = controller.getLiveness();
    expect(live.status).toBe('ok');
    expect(live.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(live.timestamp).toBeDefined();
  });

  it('handles readiness probe successfully against live local services', async () => {
    let capturedStatus = 0;
    let capturedBody: any = null;

    const mockRes: any = {
      status(code: number) {
        capturedStatus = code;
        return this;
      },
      json(data: any) {
        capturedBody = data;
        return this;
      },
    };

    await controller.getReadiness(mockRes);
    expect(capturedStatus).toBe(200);
    expect(capturedBody.status).toBe('ready');
    expect(capturedBody.services.database).toBe('ok');
    expect(capturedBody.services.cache).toBe('ok');
  });

  it('reports dependency failure when database is unreachable', async () => {
    const originalUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgresql://invalid_user:invalid_pass@127.0.0.1:5439/nonexistent';

    let capturedStatus = 0;
    let capturedBody: any = null;

    const mockRes: any = {
      status(code: number) {
        capturedStatus = code;
        return this;
      },
      json(data: any) {
        capturedBody = data;
        return this;
      },
    };

    await controller.getReadiness(mockRes);
    expect(capturedStatus).toBe(503);
    expect(capturedBody.status).toBe('unhealthy');
    expect(capturedBody.services.database).toContain('error');

    process.env.DATABASE_URL = originalUrl;
  });
});
