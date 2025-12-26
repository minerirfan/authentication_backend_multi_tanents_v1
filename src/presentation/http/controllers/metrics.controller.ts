/**
 * Metrics Controller
 * 
 * Provides endpoint for Prometheus metrics scraping.
 */

import { Request, Response } from 'express';
import { metricsService } from '../../../infrastructure/metrics/metrics.service';
import { ResponseFormatter } from '../responses/response-formatter';
import { Logger } from '../../../infrastructure/logging/logger';

/**
 * Get Prometheus metrics
 * GET /metrics
 * 
 * Returns metrics in Prometheus format for scraping.
 * This endpoint should be protected in production.
 */
export async function getMetrics(req: Request, res: Response): Promise<void> {
  try {
    const metrics = await metricsService.getMetrics();
    
    // Set content type for Prometheus
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    
    Logger.debug('Metrics requested', { correlationId: req.correlationId });
    
    res.status(200).send(metrics);
  } catch (error) {
    Logger.error('Failed to get metrics', error, { correlationId: req.correlationId });
    ResponseFormatter.error(
      res,
      'Failed to get metrics',
      500,
      ['METRICS_ERROR'],
      error instanceof Error ? [error.stack || error.message] : ['Unknown error']
    );
  }
}

/**
 * Get metrics summary
 * GET /metrics/summary
 * 
 * Returns a JSON summary of key metrics.
 */
export async function getMetricsSummary(req: Request, res: Response): Promise<void> {
  try {
    const metrics = await metricsService.getMetrics();
    
    // Parse metrics to extract key values
    const summary = {
      timestamp: new Date().toISOString(),
      metrics: {
        httpRequests: extractMetricValue(metrics, 'http_requests_total'),
        httpRequestDuration: extractMetricValue(metrics, 'http_request_duration_seconds_sum'),
        dbQueries: extractMetricValue(metrics, 'db_queries_total'),
        dbQueryDuration: extractMetricValue(metrics, 'db_query_duration_seconds_sum'),
        cacheOperations: extractMetricValue(metrics, 'cache_operations_total'),
        cacheHitRate: extractMetricValue(metrics, 'cache_hit_rate'),
        userRegistrations: extractMetricValue(metrics, 'user_registrations_total'),
        logins: extractMetricValue(metrics, 'logins_total'),
        passwordResets: extractMetricValue(metrics, 'password_resets_total'),
        tokenRefreshes: extractMetricValue(metrics, 'token_refreshes_total'),
        errors: extractMetricValue(metrics, 'errors_total'),
      },
    };
    
    Logger.debug('Metrics summary requested', { correlationId: req.correlationId });
    
    ResponseFormatter.success(res, summary, 'Metrics summary');
  } catch (error) {
    Logger.error('Failed to get metrics summary', error, { correlationId: req.correlationId });
    ResponseFormatter.error(
      res,
      'Failed to get metrics summary',
      500,
      ['METRICS_SUMMARY_ERROR'],
      error instanceof Error ? [error.stack || error.message] : ['Unknown error']
    );
  }
}

/**
 * Extract metric value from Prometheus format
 */
function extractMetricValue(metrics: string, metricName: string): number {
  const lines = metrics.split('\n');
  for (const line of lines) {
    if (line.startsWith(metricName) && !line.startsWith('#')) {
      const parts = line.split(' ');
      if (parts.length >= 2) {
        return parseFloat(parts[1]);
      }
    }
  }
  return 0;
}
