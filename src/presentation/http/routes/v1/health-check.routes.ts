/**
 * Health Check Routes
 * 
 * Routes for health checks, liveness probes, and readiness probes.
 */

import { Router } from 'express';
import {
  getOverallHealth,
  getLiveness,
  getReadiness,
  getHealthCheck,
  getHealthSummary,
} from '../../controllers/health-check.controller';

const router = Router();

/**
 * @route   GET /v1/health
 * @desc    Get overall health status
 * @access  Public
 */
router.get('/health', getOverallHealth);

/**
 * @route   GET /v1/health/live
 * @desc    Get liveness status (Kubernetes liveness probe)
 * @access  Public
 */
router.get('/health/live', getLiveness);

/**
 * @route   GET /v1/health/ready
 * @desc    Get readiness status (Kubernetes readiness probe)
 * @access  Public
 */
router.get('/health/ready', getReadiness);

/**
 * @route   GET /v1/health/summary
 * @desc    Get simplified health summary
 * @access  Public
 */
router.get('/health/summary', getHealthSummary);

/**
 * @route   GET /v1/health/:check
 * @desc    Get specific health check (database, redis, memory, disk, cpu)
 * @access  Public
 */
router.get('/health/:check', getHealthCheck);

export default router;
