import { Router } from 'express';
import { UserPermissionsController } from '../../controllers/user-permissions.controller';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { generalRateLimiter } from '../../middleware/rate-limit.middleware';

export function createUserPermissionsRoutes(): Router {
  const router = Router();
  const userPermissionsController = new UserPermissionsController();

  router.use(AuthMiddleware.authenticate);

  router.get('/', generalRateLimiter, userPermissionsController.getCurrentUserPermissions.bind(userPermissionsController));

  return router;
}