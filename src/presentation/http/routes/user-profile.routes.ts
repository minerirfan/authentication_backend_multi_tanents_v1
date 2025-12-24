import { Router } from 'express';
import { UserProfileController } from '../controllers/user-profile.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { TenantMiddleware } from '../middleware/tenant.middleware';
import { generalRateLimiter } from '../middleware/rate-limit.middleware';

export function createUserProfileRoutes(): Router {
  const router = Router();
  const userProfileController = new UserProfileController();

  router.use(AuthMiddleware.authenticate);
  router.use(TenantMiddleware.extractTenant);

  router.get('/:userId', generalRateLimiter, userProfileController.getByUserId.bind(userProfileController));
  router.post('/:userId', generalRateLimiter, userProfileController.create.bind(userProfileController));
  router.put('/:userId', generalRateLimiter, userProfileController.update.bind(userProfileController));

  return router;
}

