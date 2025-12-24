import { Router } from 'express';
import { TenantController } from '../../controllers/tenant.controller';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { SuperAdminMiddleware } from '../../middleware/super-admin.middleware';
import { ValidationMiddleware } from '../../middleware/validation.middleware';
import { generalRateLimiter, strictRateLimiter } from '../../middleware/rate-limit.middleware';
import { body } from 'express-validator';

export function createTenantRoutes(): Router {
  const router = Router();
  const tenantController = new TenantController();

  router.use(AuthMiddleware.authenticate);
  router.use(SuperAdminMiddleware.requireSuperAdmin);

  router.get('/', generalRateLimiter, tenantController.getAll.bind(tenantController));
  router.post(
    '/',
    strictRateLimiter,
    ValidationMiddleware.validate([
      body('name').notEmpty().withMessage('Tenant name is required'),
      body('slug')
        .notEmpty()
        .withMessage('Tenant slug is required')
        .matches(/^[a-z0-9-]+$/)
        .withMessage('Tenant slug must contain only lowercase letters, numbers, and hyphens'),
      body('adminEmail').isEmail().withMessage('Valid admin email is required'),
      body('adminPassword')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
      body('adminFirstName').notEmpty().withMessage('Admin first name is required'),
      body('adminLastName').notEmpty().withMessage('Admin last name is required'),
    ]),
    tenantController.create.bind(tenantController)
  );
  router.put(
    '/:id',
    strictRateLimiter,
    ValidationMiddleware.validate([
      body('name').notEmpty().withMessage('Tenant name is required'),
      body('slug')
        .notEmpty()
        .withMessage('Tenant slug is required')
        .matches(/^[a-z0-9-]+$/)
        .withMessage('Tenant slug must contain only lowercase letters, numbers, and hyphens'),
    ]),
    tenantController.update.bind(tenantController)
  );
  router.delete('/:id', strictRateLimiter, tenantController.delete.bind(tenantController));

  return router;
}

