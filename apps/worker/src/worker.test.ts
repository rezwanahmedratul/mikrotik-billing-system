import { describe, it, expect } from 'vitest';
import { BackgroundWorker } from './main.js';

describe('BackgroundWorker', () => {
  it('initializes and executes jobs', async () => {
    const workerInstance = new BackgroundWorker();
    await workerInstance.start();
    expect(workerInstance.isRunning).toBe(true);

    const result = workerInstance.processJob({
      id: 'job-123',
      name: 'SYNC_ROUTER_STATE',
      data: { routerId: 'r-1' },
    });

    expect(result.processed).toBe(true);
    expect(result.jobId).toBe('job-123');

    await workerInstance.stop();
    expect(workerInstance.isRunning).toBe(false);
  });
});
