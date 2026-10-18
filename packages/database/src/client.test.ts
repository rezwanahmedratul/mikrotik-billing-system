import { describe, it, expect } from 'vitest';
import { prisma } from './client.js';

describe('Database client singleton', () => {
  it('instantiates PrismaClient singleton correctly', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.tenant.findMany).toBe('function');
    expect(typeof prisma.user.findMany).toBe('function');
    expect(typeof prisma.router.findMany).toBe('function');
  });
});
