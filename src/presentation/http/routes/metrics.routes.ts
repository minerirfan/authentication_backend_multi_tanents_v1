/**
 * Metrics Routes
 * 
 * Routes for Prometheus metrics scraping.
 */

import { Router } from 'express';
import { getMetrics, getMetricsSummary } from '../controllers/metrics.controller';

const router = Router();

/**
 * @route   GET /metrics
 * @desc    Get Prometheus metrics
 * @access  Public (should be protected in production)
 */
router.get('/metrics', getMetrics);

/**
 * @route   GET /metrics/summary
 * @desc    Get metrics summary as JSON
 * @access  Public
 */
router.get('/metrics/summary', getMetricsSummary);

export function createMetricsRoutes(): Router {
  return router;
}
