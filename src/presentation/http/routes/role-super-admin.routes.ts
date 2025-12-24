import { Router } from 'express';
import { RoleController } from '../controllers/role.controller';
import { CreateRoleForTenantUseCase } from '../../../application/use-cases/role/create-role-for-tenant.use-case';
import { RoleRepository } from '../../../infrastructure/persistence/role.repository';
import { PermissionRepository } from '../../../infrastructure/persistence/permission.repository';
import { TenantRepository } from '../../../infrastructure/persistence/tenant.repository';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { SuperAdminMiddleware } from '../middleware/super-admin.middleware';
import { ValidationMiddleware } from '../middleware/validation.middleware';
import { createRoleValidator } from '../validators/role.validator';
import { ResponseFormatter } from '../responses/response-formatter';
import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';

const router = Router();

router.use(AuthMiddleware.authenticate);
router.use(SuperAdminMiddleware.requireSuperAdmin);

// Create role for a specific tenant
router.post(
  '/tenant/:tenantId',
  ValidationMiddleware.validate(createRoleValidator),
  async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      const roleRepository = new RoleRepository();
      const permissionRepository = new PermissionRepository();
      const tenantRepository = new TenantRepository();
      const createRoleForTenantUseCase = new CreateRoleForTenantUseCase(
        roleRepository,
        permissionRepository,
        tenantRepository
      );

      const result = await createRoleForTenantUseCase.execute(req.body, req.params.tenantId);
      return ResponseFormatter.success(res, result, 'Role created successfully', 201);
    } catch (error) {
      next(error);
    }
  }
);

export default router;

