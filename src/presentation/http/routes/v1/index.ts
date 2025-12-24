import { Router } from 'express';
import { createAuthRoutes } from './auth.routes';
import { createUserRoutes } from './user.routes';
import { createUserProfileRoutes } from '../user-profile.routes';
import { createRoleRoutes } from './role.routes';
import { createPermissionRoutes } from './permission.routes';
import { createTenantRoutes } from './tenant.routes';
import { createRoleSuperAdminRoutes } from './role-super-admin.routes';
import { createUserPermissionsRoutes } from './user-permissions.routes';
import { createHealthRoutes } from './health.routes';

export function createV1Routes(): Router {
  const router = Router();

  // Mount all v1 routes (controllers created here after container init)
  router.use('/health', createHealthRoutes());
  router.use('/auth', createAuthRoutes());
  router.use('/users', createUserRoutes());
  router.use('/user-profiles', createUserProfileRoutes());
  router.use('/user/permissions', createUserPermissionsRoutes());
  router.use('/roles', createRoleRoutes());
  router.use('/roles', createRoleSuperAdminRoutes());
  router.use('/permissions', createPermissionRoutes());
  router.use('/tenants', createTenantRoutes());

  return router;
}

