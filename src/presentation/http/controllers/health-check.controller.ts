/**
 * Health Check Controller
 *
 * Provides endpoints for health checks, liveness probes, and readiness probes
 * suitable for Kubernetes and other orchestration systems.
 */

import { Request, Response } from 'express';
import { healthCheckService, HealthStatus } from '../../../infrastructure/health/health-check.service';
import { Logger } from '../../../infrastructure/logging/logger';
import { ResponseFormatter } from '../responses/response-formatter';

/**
 * Get overall health status
 * GET /health
 */
export async function getOverallHealth(req: Request, res: Response): Promise<void> {
  try {
    const health = await healthCheckService.getOverallHealth();
    
    // Set appropriate status code based on health status
    const statusCode = health.status === HealthStatus.HEALTHY ? 200 :
                      health.status === HealthStatus.DEGRADED ? 200 : 503;
    
    Logger.info('Health check requested', {
      status: health.status,
      correlationId: req.correlationId,
    });
    
    ResponseFormatter.success(res, health, 'Health check completed', statusCode);
  } catch (error) {
    Logger.error('Health check failed', error, { correlationId: req.correlationId });
    ResponseFormatter.error(
      res,
      'Health check failed',
      503,
      ['HEALTH_CHECK_ERROR'],
      error instanceof Error ? [error.stack || error.message] : ['Unknown error']
    );
  }
}

/**
 * Get liveness status
 * GET /health/live
 * 
 * Returns 200 if the process is running, 503 otherwise.
 * Used by Kubernetes liveness probe.
 */
export async function getLiveness(req: Request, res: Response): Promise<void> {
  try {
    const liveness = await healthCheckService.getLiveness();
    
    ResponseFormatter.success(res, liveness, 'Service is alive', 200);
  } catch (error) {
    Logger.error('Liveness check failed', error, { correlationId: req.correlationId });
    ResponseFormatter.error(
      res,
      'Liveness check failed',
      503,
      ['LIVENESS_ERROR'],
      error instanceof Error ? [error.stack || error.message] : ['Unknown error']
    );
  }
}

/**
 * Get readiness status
 * GET /health/ready
 * 
 * Returns 200 if all dependencies are ready, 503 otherwise.
 * Used by Kubernetes readiness probe.
 */
export async function getReadiness(req: Request, res: Response): Promise<void> {
  try {
    const readiness = await healthCheckService.getReadiness();
    
    const statusCode = readiness.status === 'ready' ? 200 : 503;
    
    Logger.info('Readiness check requested', {
      status: readiness.status,
      correlationId: req.correlationId,
    });
    
    ResponseFormatter.success(res, readiness, 'Readiness check completed', statusCode);
  } catch (error) {
    Logger.error('Readiness check failed', error, { correlationId: req.correlationId });
    ResponseFormatter.error(
      res,
      'Readiness check failed',
      503,
      ['READINESS_ERROR'],
      error instanceof Error ? [error.stack || error.message] : ['Unknown error']
    );
  }
}

/**
 * Get specific health check
 * GET /health/:check
 * 
 * Returns the status of a specific health check.
 * Supported checks: database, redis, memory, disk, cpu
 */
export async function getHealthCheck(req: Request, res: Response): Promise<void> {
  try {
    const { check } = req.params;
    
    if (!check) {
      ResponseFormatter.error(
        res,
        'Check name is required',
        400,
        ['MISSING_CHECK_NAME']
      );
      return;
    }
    
    const result = await healthCheckService.getCheck(check);
    
    const statusCode = result.status === HealthStatus.HEALTHY ? 200 : 503;
    
    Logger.info(`Health check requested: ${check}`, {
      status: result.status,
      correlationId: req.correlationId,
    });
    
    ResponseFormatter.success(res, result, `Health check for ${check}`, statusCode);
  } catch (error) {
    Logger.error(`Health check failed for ${req.params.check}`, error, {
      correlationId: req.correlationId
    });
    ResponseFormatter.error(
      res,
      'Health check failed',
      503,
      ['HEALTH_CHECK_ERROR'],
      error instanceof Error ? [error.stack || error.message] : ['Unknown error']
    );
  }
}

/**
 * Get health check summary (simplified version)
 * GET /health/summary
 * 
 * Returns a simplified health status for quick monitoring.
 */
export async function getHealthSummary(req: Request, res: Response): Promise<void> {
  try {
    const health = await healthCheckService.getOverallHealth();
    
    const summary = {
      status: health.status,
      uptime: health.uptime,
      version: health.version,
      environment: health.environment,
      checks: health.checks.map((c: any) => ({
        name: c.name,
        status: c.status,
        duration: c.duration,
      })),
    };
    
    ResponseFormatter.success(res, summary, 'Health summary', 200);
  } catch (error) {
    Logger.error('Health summary failed', error, { correlationId: req.correlationId });
    ResponseFormatter.error(
      res,
      'Health summary failed',
      503,
      ['HEALTH_SUMMARY_ERROR'],
      error instanceof Error ? [error.stack || error.message] : ['Unknown error']
    );
  }
}
