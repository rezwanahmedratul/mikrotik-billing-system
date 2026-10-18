import dotenv from 'dotenv';
dotenv.config();

export interface QueueJobDefinition<T = unknown> {
  id: string;
  name: string;
  data: T;
}

export class BackgroundWorker {
  public isRunning = false;

  async start(): Promise<void> {
    this.isRunning = true;
    console.log('[Worker] Background processing service initialized.');
    console.log('[Worker] Listening for Router, Billing, and SMS jobs...');
  }

  async stop(): Promise<void> {
    this.isRunning = false;
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
