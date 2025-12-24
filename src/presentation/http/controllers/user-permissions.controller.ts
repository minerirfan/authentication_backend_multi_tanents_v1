import { Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import { container } from '../../../infrastructure/di/container';
import { ResponseFormatter } from '../responses/response-formatter';
import { IUserRoleRepository } from '../../../domain/repositories/iuser-role-repository';
import { IRoleRepository } from '../../../domain/repositories/irole-repository';
import { IPermissionRepository } from '../../../domain/repositories/ipermission-repository';

export class UserPermissionsController {
  private userRoleRepository: IUserRoleRepository;
  private roleRepository: IRoleRepository;
  private permissionRepository: IPermissionRepository;

  constructor() {
    this.userRoleRepository = container.get<IUserRoleRepository>('IUserRoleRepository');
    this.roleRepository = container.get<IRoleRepository>('IRoleRepository');
    this.permissionRepository = container.get<IPermissionRepository>('IPermissionRepository');
  }

  /**
   * @swagger
   * /api/v1/user/permissions:
   *   get:
   *     summary: Get current user's permissions
   *     description: Returns permissions based on user's roles. Admin users get all permissions.
   *     tags: [User Permissions]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User permissions retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 results:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: string
   *                       name:
   *                         type: string
   *                       resource:
   *                         type: string
   *                       action:
   *                         type: string
   *                       description:
   *                         type: string
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   */
  async getCurrentUserPermissions(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userId = req.user?.userId;
      const tenantId = req.user?.tenantId;
      const isSuperAdmin = req.user?.isSuperAdmin;

      if (!userId) {
        return ResponseFormatter.error(res, 'User not authenticated', 401);
      }

      let permissions;

      // Super admin gets all permissions
      if (isSuperAdmin) {
        permissions = await this.permissionRepository.findAll();
      } else {
        // Get user with roles
        const userWithRoles = await this.userRoleRepository.getUserWithRoles(userId);
        
        if (!userWithRoles || !userWithRoles.roles || userWithRoles.roles.length === 0) {
          return ResponseFormatter.success(res, [], 'No permissions found for user', 200);
        }

        // Extract permissions from user's roles
        const roles = userWithRoles.roles;
        const permissionIds = new Set<string>();
        
        roles.forEach(role => {
          role.permissions?.forEach(permission => {
            permissionIds.add(permission.id);
          });
        });

        if (permissionIds.size === 0) {
          return ResponseFormatter.success(res, [], 'No permissions found for user roles', 200);
        }

        permissions = await this.permissionRepository.findByIds(Array.from(permissionIds));
      }

      const result = permissions.map(permission => ({
        id: permission.id,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
      }));

      return ResponseFormatter.success(res, result, 'User permissions retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}