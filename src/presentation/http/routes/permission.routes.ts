import { Router } from 'express';
import { PermissionController } from '../controllers/permission.controller';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { SuperAdminMiddleware } from '../middleware/super-admin.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import { generalRateLimiter, strictRateLimiter } from '../middleware/rate-limit.middleware';
import { body } from 'express-validator';

const router = Router();
const permissionController = new PermissionController();

router.use(AuthMiddleware.authenticate);

router.get('/', generalRateLimiter, permissionController.getAll.bind(permissionController));

// Super admin only routes
router.post(
  '/',
  SuperAdminMiddleware.requireSuperAdmin,
  strictRateLimiter,
  ValidationMiddleware.validate([
    body('name').notEmpty().withMessage('Permission name is required'),
    body('resource').notEmpty().withMessage('Resource is required'),
    body('action').notEmpty().withMessage('Action is required'),
  ]),
  permissionController.create.bind(permissionController)
);

router.put(
  '/:id',
  SuperAdminMiddleware.requireSuperAdmin,
  strictRateLimiter,
  ValidationMiddleware.validate([
    body('name').optional().notEmpty().withMessage('Permission name cannot be empty'),
    body('resource').optional().notEmpty().withMessage('Resource cannot be empty'),
    body('action').optional().notEmpty().withMessage('Action cannot be empty'),
  ]),
  permissionController.update.bind(permissionController)
);

router.delete(
  '/:id',
  SuperAdminMiddleware.requireSuperAdmin,
  strictRateLimiter,
  permissionController.delete.bind(permissionController)
);

export default router;

