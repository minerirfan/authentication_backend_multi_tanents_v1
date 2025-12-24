import { Router } from 'express';
import { RoleController } from '../../controllers/role.controller';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { TenantMiddleware } from '../../middleware/tenant.middleware';
import { ValidationMiddleware } from '../../middleware/validation.middleware';
import { generalRateLimiter, strictRateLimiter } from '../../middleware/rate-limit.middleware';
import { createRoleValidator, updateRoleValidator } from '../../validators/role.validator';

export function createRoleRoutes(): Router {
  const router = Router();
  const roleController = new RoleController();

  router.use(AuthMiddleware.authenticate);
  router.use(TenantMiddleware.extractTenant);

  router.get('/', generalRateLimiter, roleController.getAll.bind(roleController));
  router.get('/:id', generalRateLimiter, roleController.getById.bind(roleController));
  router.post(
    '/',
    strictRateLimiter,
    ValidationMiddleware.validate(createRoleValidator),
    roleController.create.bind(roleController)
  );
  router.put(
    '/:id',
    strictRateLimiter,
    ValidationMiddleware.validate(updateRoleValidator),
    roleController.update.bind(roleController)
  );
  router.delete('/:id', strictRateLimiter, roleController.delete.bind(roleController));

  return router;
}

