import { PrismaNeonHttp } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  // In production or when DATABASE_URL is available with neon adapter
  if (connectionString && connectionString.startsWith('postgres')) {
    try {
      const adapter = new PrismaNeonHttp(connectionString, {});
      return new PrismaClient({ adapter });
    } catch (err) {
      console.warn('[Prisma] Neon adapter initialization fallback:', err);
    }
  }

  // Fallback to standard PrismaClient
  return new PrismaClient();
}

export const prisma = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
