import { Router } from 'express';
import { container } from '../../../../infrastructure/di/container';
import { AuthMiddleware } from '../../middleware/auth.middleware';
import { SuperAdminMiddleware } from '../../middleware/super-admin.middleware';
import { ValidationMiddleware } from '../../middleware/validation.middleware';
import { createRoleValidator } from '../../validators/role.validator';
import { ResponseFormatter } from '../../responses/response-formatter';
import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../../shared/types';
import { CreateRoleForTenantUseCase } from '../../../../application/use-cases/role/create-role-for-tenant.use-case';

export function createRoleSuperAdminRoutes(): Router {
  const router = Router();

  router.use(AuthMiddleware.authenticate);
  router.use(SuperAdminMiddleware.requireSuperAdmin);

  // Create role for a specific tenant
  router.post(
    '/tenant/:tenantId',
    ValidationMiddleware.validate(createRoleValidator),
    async (req: RequestWithUser, res: Response, next: NextFunction) => {
      try {
        const createRoleForTenantUseCase = container.get<CreateRoleForTenantUseCase>('CreateRoleForTenantUseCase');
        const result = await createRoleForTenantUseCase.execute(req.body, req.params.tenantId);
        return ResponseFormatter.success(res, result, 'Role created successfully', 201);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

