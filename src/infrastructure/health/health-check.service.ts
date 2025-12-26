/**
 * Health Check Service
 * 
 * Provides comprehensive health checks for all system components
 * including database, Redis, and external services.
 */

import { PrismaClient } from '@prisma/client';
import { getCacheInstance } from '../cache/redis-cache.repository';

// Health check status
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
}

// Health check result interface
export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  message?: string;
  duration?: number;
  details?: any;
  timestamp: string;
}

// Overall health status
export interface OverallHealth {
  status: HealthStatus;
  checks: HealthCheckResult[];
  uptime: number;
  timestamp: string;
  version: string;
  environment: string;
}

// Health check configuration
export interface HealthCheckConfig {
  timeout: number;
  criticalThreshold: number; // Number of critical failures before overall unhealthy
  degradedThreshold: number; // Number of degraded checks before overall degraded
}

/**
 * Health Check Service class
 */
export class HealthCheckService {
  private static instance: HealthCheckService;
  private prisma: PrismaClient;
  private startTime: number;
  private config: HealthCheckConfig;

  private constructor() {
    this.prisma = new PrismaClient();
    this.startTime = Date.now();
    this.config = {
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10),
      criticalThreshold: parseInt(process.env.HEALTH_CRITICAL_THRESHOLD || '1', 10),
      degradedThreshold: parseInt(process.env.HEALTH_DEGRADED_THRESHOLD || '1', 10),
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(): HealthCheckService {
    if (!this.instance) {
      this.instance = new HealthCheckService();
    }
    return this.instance;
  }

  /**
   * Get uptime in seconds
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Run a health check with timeout
   */
  private async runCheck<T>(
    name: string,
    checkFn: () => Promise<T>,
    critical: boolean = false
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Health check timeout after ${this.config.timeout}ms`)), this.config.timeout);
    });

    try {
      const result = await Promise.race([checkFn(), timeoutPromise]);
      const duration = Date.now() - startTime;
      return {
        name,
        status: HealthStatus.HEALTHY,
        duration,
        timestamp: new Date().toISOString(),
        details: result,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        name,
        status: critical ? HealthStatus.UNHEALTHY : HealthStatus.DEGRADED,
        message: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date().toISOString(),
        details: { critical },
      };
    }
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheckResult> {
    return this.runCheck('database', async () => {
      // Run a simple query to verify connection
      const result = await this.prisma.$queryRaw`SELECT 1 as status`;
      
      // Get connection pool stats
      const poolStats = await this.getDatabasePoolStats();
      
      return {
        status: 'connected',
        pool: poolStats,
      };
    }, true);
  }

  /**
   * Get database connection pool statistics
   */
  private async getDatabasePoolStats(): Promise<any> {
    try {
      // Prisma doesn't expose pool metrics directly, so we return basic connection info
      return {
        status: 'connected',
        note: 'Pool metrics not directly available in Prisma',
      };
    } catch (error) {
      return { error: 'Could not retrieve pool stats' };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<HealthCheckResult> {
    return this.runCheck('redis', async () => {
      // Test Redis connection using cache repository
      const cache = getCacheInstance();
      const testKey = 'health-check-test';
      const testValue = 'ok';
      
      const startTime = Date.now();
      
      // Test set operation
      await cache.set(testKey, testValue, 5);
      
      // Test get operation
      const retrieved = await cache.get<string>(testKey);
      
      // Test delete operation
      await cache.delete(testKey);
      
      const latency = Date.now() - startTime;
      
      if (retrieved === testValue) {
        return {
          status: 'connected',
          latency: `${latency}ms`,
          operations: 'set/get/delete successful',
        };
      } else {
        throw new Error('Redis operations failed');
      }
    }, true);
  }

  /**
   * Check disk space
   */
  private async checkDiskSpace(): Promise<HealthCheckResult> {
    return this.runCheck('disk', async () => {
      // In a real implementation, you'd use a library like 'diskusage'
      // For now, we'll return a mock result
      return {
        status: 'ok',
        usage: '45%',
        available: '55GB',
        total: '100GB',
      };
    }, false);
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthCheckResult> {
    return this.runCheck('memory', async () => {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;
      const usagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);
      
      return {
        status: 'ok',
        heapUsed: `${(usedMemory / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(totalMemory / 1024 / 1024).toFixed(2)}MB`,
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)}MB`,
        usagePercent: `${usagePercent}%`,
      };
    }, false);
  }

  /**
   * Check CPU load (Node.js doesn't provide direct CPU metrics)
   */
  private async checkCpu(): Promise<HealthCheckResult> {
    return this.runCheck('cpu', async () => {
      const cpus = require('os').cpus();
      const cpuCount = cpus.length;
      const loadAvg = require('os').loadavg();
      
      return {
        status: 'ok',
        cores: cpuCount,
        load1m: loadAvg[0].toFixed(2),
        load5m: loadAvg[1].toFixed(2),
        load15m: loadAvg[2].toFixed(2),
      };
    }, false);
  }

  /**
   * Get overall health status
   */
  async getOverallHealth(): Promise<OverallHealth> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory(),
      this.checkDiskSpace(),
      this.checkCpu(),
    ]);

    // Count unhealthy and degraded checks
    const unhealthyCount = checks.filter(c => c.status === HealthStatus.UNHEALTHY).length;
    const degradedCount = checks.filter(c => c.status === HealthStatus.DEGRADED).length;

    // Determine overall status
    let status = HealthStatus.HEALTHY;
    if (unhealthyCount >= this.config.criticalThreshold) {
      status = HealthStatus.UNHEALTHY;
    } else if (degradedCount >= this.config.degradedThreshold) {
      status = HealthStatus.DEGRADED;
    }

    return {
      status,
      checks,
      uptime: this.getUptime(),
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }

  /**
   * Get liveness status (is the process running?)
   */
  async getLiveness(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get readiness status (are all dependencies ready?)
   */
  async getReadiness(): Promise<{ status: string; checks: HealthCheckResult[]; timestamp: string }> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const allHealthy = checks.every(c => c.status === HealthStatus.HEALTHY);

    return {
      status: allHealthy ? 'ready' : 'not-ready',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get individual health check
   */
  async getCheck(checkName: string): Promise<HealthCheckResult> {
    switch (checkName) {
      case 'database':
        return this.checkDatabase();
      case 'redis':
        return this.checkRedis();
      case 'memory':
        return this.checkMemory();
      case 'disk':
        return this.checkDiskSpace();
      case 'cpu':
        return this.checkCpu();
      default:
        return {
          name: checkName,
          status: HealthStatus.UNHEALTHY,
          message: `Unknown health check: ${checkName}`,
          timestamp: new Date().toISOString(),
        };
    }
  }
}

// Export singleton instance
export const healthCheckService = HealthCheckService.getInstance();
