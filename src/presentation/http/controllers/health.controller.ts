import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../responses/response-formatter';
import { prisma } from '../../../infrastructure/config/database';

export class HealthController {
  /**
   * @swagger
   * /api/v1/health:
   *   get:
   *     summary: Basic health check
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is healthy
   */
  async basic(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      return ResponseFormatter.success(res, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }, 'Service is healthy', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/health/detailed:
   *   get:
   *     summary: Detailed health check with dependencies
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Detailed health status
   *       503:
   *         description: Service unavailable
   */
  async detailed(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const checks = {
        database: await this.checkDatabase(),
        memory: this.checkMemory(),
        environment: this.checkEnvironment(),
      };

      const isHealthy = Object.values(checks).every(check => check.status === 'ok');
      const statusCode = isHealthy ? 200 : 503;

      const healthData = {
        status: isHealthy ? 'ok' : 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks,
      };

      return ResponseFormatter.success(res, healthData, 
        isHealthy ? 'All systems operational' : 'Some systems are down', statusCode);
    } catch (error) {
      next(error);
    }
  }

  private async checkDatabase(): Promise<{ status: string; responseTime?: number; error?: string }> {
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;
      
      return {
        status: 'ok',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Database connection failed',
      };
    }
  }

  private checkMemory(): { status: string; usage: NodeJS.MemoryUsage } {
    const usage = process.memoryUsage();
    const maxHeapSize = 1024 * 1024 * 1024; // 1GB threshold
    
    return {
      status: usage.heapUsed < maxHeapSize ? 'ok' : 'warning',
      usage,
    };
  }

  private checkEnvironment(): { status: string; variables: string[] } {
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    return {
      status: missing.length === 0 ? 'ok' : 'error',
      variables: missing.length > 0 ? missing : ['All required variables present'],
    };
  }
}