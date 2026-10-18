import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prismaInstance: PrismaClient | undefined;
}

export function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

// Global singleton to prevent connection pool exhaustion during hot reload
export const prisma: PrismaClient = globalThis.__prismaInstance ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prismaInstance = prisma;
}

export { PrismaClient };
export default prisma;
