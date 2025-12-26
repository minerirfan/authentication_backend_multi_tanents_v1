// Re-export from database.config.ts for backward compatibility
export {
  prisma,
  connectDatabase,
  disconnectDatabase,
  buildDatabaseUrl,
  getPoolConfig,
  getPoolMetrics,
  checkPoolHealth,
  startPoolMetrics,
  stopPoolMetrics,
} from './database.config';
