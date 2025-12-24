import { Router } from 'express';
import { UserController } from '../../controllers/user.controller';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { TenantMiddleware } from '../../middleware/tenant.middleware';
import { ValidationMiddleware } from '../../middleware/validation.middleware';
import { generalRateLimiter, strictRateLimiter } from '../../middleware/rate-limit.middleware';
import { createUserValidator, updateUserValidator } from '../../validators/user.validator';

export function createUserRoutes(): Router {
  const router = Router();
  const userController = new UserController();

  router.use(AuthMiddleware.authenticate);
  // Tenant middleware allows super admin to bypass
  router.use(TenantMiddleware.extractTenant);

  router.get('/', generalRateLimiter, userController.getAll.bind(userController));
  router.get('/:id', generalRateLimiter, userController.getById.bind(userController));
  router.post(
    '/',
    strictRateLimiter,
    ValidationMiddleware.validate(createUserValidator),
    userController.create.bind(userController)
  );
  router.put(
    '/:id',
    strictRateLimiter,
    ValidationMiddleware.validate(updateUserValidator),
    userController.update.bind(userController)
  );
  router.delete('/:id', strictRateLimiter, userController.delete.bind(userController));

  return router;
}

