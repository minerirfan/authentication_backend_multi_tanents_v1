import { PrismaClient } from '@prisma/client';

// Configure connection pooling
// Connection limit and pool timeout can be set via DATABASE_URL query params
// Example: DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

