import { PrismaClient } from '@prisma/client';

/**
 * Database connection pool configuration
 */
export interface DatabasePoolConfig {
  // Connection pool size
  connectionLimit: number;
  
  // Timeout for getting a connection from pool (ms)
  poolTimeout: number;
  
  // Max idle time for a connection before it's closed (ms)
  poolIdleTimeout: number;
  
  // Connection statement cache size
  statementCacheSize: number;
  
  // Enable connection pool logging
  enablePoolLogging: boolean;
}

/**
 * Default pool configuration based on environment
 */
function getDefaultPoolConfig(): DatabasePoolConfig {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';

  if (isTest) {
    // Test environment: minimal pool
    return {
      connectionLimit: 1,
      poolTimeout: 5000,
      poolIdleTimeout: 10000,
      statementCacheSize: 0,
      enablePoolLogging: false,
    };
  }

  if (isDevelopment) {
    // Development: moderate pool
    return {
      connectionLimit: 10,
      poolTimeout: 10000,
      poolIdleTimeout: 30000,
      statementCacheSize: 100,
      enablePoolLogging: true,
    };
  }

  // Production: optimized pool
  return {
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20', 10),
    poolTimeout: parseInt(process.env.DB_POOL_TIMEOUT || '10000', 10),
    poolIdleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000', 10),
    statementCacheSize: parseInt(process.env.DB_STATEMENT_CACHE_SIZE || '100', 10),
    enablePoolLogging: process.env.DB_POOL_LOGGING === 'true',
  };
}

/**
 * Build DATABASE_URL with connection pool parameters
 */
export function buildDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }

  const config = getDefaultPoolConfig();

  // Check if URL already has query parameters
  const separator = baseUrl.includes('?') ? '&' : '?';

  // Build connection pool parameters
  const params = new URLSearchParams({
    connection_limit: config.connectionLimit.toString(),
    pool_timeout: config.poolTimeout.toString(),
    connect_timeout: '10',
  });

  return `${baseUrl}${separator}${params.toString()}`;
}

/**
 * Get pool configuration
 */
export function getPoolConfig(): DatabasePoolConfig {
  return getDefaultPoolConfig();
}

/**
 * Prisma client with connection pooling
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: buildDatabaseUrl(),
    },
  },
});

/**
 * Connect to database with pool monitoring
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    // Log pool configuration in development
    const config = getPoolConfig();
    if (config.enablePoolLogging) {
      console.log('Database pool configuration:', {
        connectionLimit: config.connectionLimit,
        poolTimeout: config.poolTimeout,
        poolIdleTimeout: config.poolIdleTimeout,
        statementCacheSize: config.statementCacheSize,
      });
    }

    // Enable pool metrics in production
    if (process.env.NODE_ENV === 'production') {
      startPoolMetrics();
    }
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('Database disconnected');
}

/**
 * Get database connection pool metrics
 */
export async function getPoolMetrics(): Promise<{
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  maxConnections: number;
}> {
  try {
    // Query PostgreSQL for connection pool stats
    const result = await prisma.$queryRaw<Array<{ count: string }>>`
      SELECT count(*) as count 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;

    const totalConnections = parseInt(result[0]?.count || '0', 10);
    const config = getPoolConfig();

    // Approximate active/idle based on total
    const activeConnections = Math.min(totalConnections, Math.floor(totalConnections * 0.7));
    const idleConnections = totalConnections - activeConnections;

    return {
      activeConnections,
      idleConnections,
      totalConnections,
      maxConnections: config.connectionLimit,
    };
  } catch (error) {
    console.error('Failed to get pool metrics:', error);
    return {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      maxConnections: getPoolConfig().connectionLimit,
    };
  }
}

/**
 * Start periodic pool metrics collection
 */
export let metricsInterval: NodeJS.Timeout | null = null;

export function startPoolMetrics(): void {
  if (metricsInterval) {
    return;
  }

  const intervalMs = parseInt(process.env.DB_POOL_METRICS_INTERVAL || '60000', 10); // Default: 1 minute

  metricsInterval = setInterval(async () => {
    try {
      const metrics = await getPoolMetrics();
      console.log('[Pool Metrics]', JSON.stringify(metrics));

      // Log warning if pool is nearly full
      const usagePercent = (metrics.totalConnections / metrics.maxConnections) * 100;
      if (usagePercent > 80) {
        console.warn(`[Pool Warning] Connection pool at ${usagePercent.toFixed(1)}% capacity`);
      }
    } catch (error) {
      console.error('Failed to collect pool metrics:', error);
    }
  }, intervalMs);
}

/**
 * Stop pool metrics collection
 */
export function stopPoolMetrics(): void {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
}

/**
 * Health check for database connection pool
 */
export async function checkPoolHealth(): Promise<{
  healthy: boolean;
  metrics: Awaited<ReturnType<typeof getPoolMetrics>>;
  latency: number;
}> {
  const startTime = Date.now();

  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;

    const metrics = await getPoolMetrics();
    const latency = Date.now() - startTime;

    // Consider unhealthy if latency > 1 second
    const healthy = latency < 1000;

    return {
      healthy,
      metrics,
      latency,
    };
  } catch (error) {
    console.error('Pool health check failed:', error);
    return {
      healthy: false,
      metrics: {
        activeConnections: 0,
        idleConnections: 0,
        totalConnections: 0,
        maxConnections: getPoolConfig().connectionLimit,
      },
      latency: Date.now() - startTime,
    };
  }
}
