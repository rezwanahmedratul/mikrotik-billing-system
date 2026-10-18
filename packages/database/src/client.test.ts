import { describe, it, expect } from 'vitest';
import { dbService, DatabaseService } from './client.js';

describe('Database client singleton', () => {
  it('instantiates correctly and returns same instance', () => {
    expect(dbService).toBeDefined();
    expect(DatabaseService.getInstance()).toBe(dbService);
  });
});
