import dotenv from 'dotenv';
dotenv.config();

import { RouterHealthPoller } from './router-poller.js';

export interface QueueJobDefinition<T = unknown> {
  id: string;
  name: string;
  data: T;
}

export class BackgroundWorker {
  public isRunning = false;
  private timer: NodeJS.Timeout | null = null;
  private poller = new RouterHealthPoller();

  async start(): Promise<void> {
    this.isRunning = true;
    console.log('[Worker] Background processing service initialized.');
    console.log('[Worker] Listening for Router, Billing, and SMS jobs...');

    const runPolling = async () => {
      try {
        await this.poller.pollAllRouters();
      } catch (err: any) {
        console.error('[Worker] Error during router health poll:', err?.message || err);
      }
    };

    runPolling().catch(() => {});
    this.timer = setInterval(runPolling, 30000);
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('[Worker] Worker stopped gracefully.');
  }

  processJob(job: QueueJobDefinition): { processed: boolean; jobId: string } {
    console.log(`[Worker] Executing job: ${job.name} (${job.id})`);
    return { processed: true, jobId: job.id };
  }
}

export const worker = new BackgroundWorker();

if (process.env.NODE_ENV !== 'test') {
  worker.start().catch((err) => {
    console.error('[Worker] Fatal error starting worker:', err);
    process.exit(1);
  });
}
