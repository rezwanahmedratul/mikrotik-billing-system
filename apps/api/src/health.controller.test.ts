import { describe, it, expect } from 'vitest';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  const controller = new HealthController();

  it('returns ok for liveness probe', () => {
    const live = controller.getLiveness();
    expect(live.status).toBe('ok');
    expect(live.uptimeSeconds).toBeGreaterThanOrEqual(0);
    expect(live.timestamp).toBeDefined();
  });

  it('returns ready for readiness probe', () => {
    const ready = controller.getReadiness();
    expect(ready.status).toBe('ready');
    expect(ready.services.database).toBe('ok');
    expect(ready.services.cache).toBe('ok');
  });
});
