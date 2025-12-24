import { Router } from 'express';
import { HealthController } from '../../controllers/health.controller';
import { generalRateLimiter } from '../../middleware/rate-limit.middleware';

export function createHealthRoutes(): Router {
  const router = Router();
  const healthController = new HealthController();

  router.get('/', generalRateLimiter, healthController.basic.bind(healthController));
  router.get('/detailed', generalRateLimiter, healthController.detailed.bind(healthController));

  return router;
}