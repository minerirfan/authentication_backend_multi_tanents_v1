import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import { container } from '../../../infrastructure/di/container';
import { ResponseFormatter } from '../responses/response-formatter';
import { GetPermissionsUseCase } from '../../../application/use-cases/permission/get-permissions.use-case';
import { CreatePermissionUseCase } from '../../../application/use-cases/permission/create-permission.use-case';
import { UpdatePermissionUseCase } from '../../../application/use-cases/permission/update-permission.use-case';
import { DeletePermissionUseCase } from '../../../application/use-cases/permission/delete-permission.use-case';

export class PermissionController {
  private getPermissionsUseCase: GetPermissionsUseCase;
  private createPermissionUseCase: CreatePermissionUseCase;
  private updatePermissionUseCase: UpdatePermissionUseCase;
  private deletePermissionUseCase: DeletePermissionUseCase;

  constructor() {
    this.getPermissionsUseCase = container.get<GetPermissionsUseCase>('GetPermissionsUseCase');
    this.createPermissionUseCase = container.get<CreatePermissionUseCase>('CreatePermissionUseCase');
    this.updatePermissionUseCase = container.get<UpdatePermissionUseCase>('UpdatePermissionUseCase');
    this.deletePermissionUseCase = container.get<DeletePermissionUseCase>('DeletePermissionUseCase');
  }

  /**
   * @swagger
   * /api/v1/permissions:
   *   get:
   *     summary: Get all permissions
   *     tags: [Permissions]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: tenantId
   *         schema:
   *           type: string
   *         description: Tenant ID (super admin only)
   *     responses:
   *       200:
   *         description: Permissions retrieved successfully
   */
  async getAll(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Super admin can specify tenantId in query, otherwise use their tenant
      const tenantId = req.user?.isSuperAdmin && req.query.tenantId
        ? req.query.tenantId as string
        : req.user?.tenantId || undefined;

      const result = await this.getPermissionsUseCase.execute(tenantId);
      return ResponseFormatter.success(res, result, 'Permissions retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/permissions:
   *   post:
   *     summary: Create new permission
   *     tags: [Permissions]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - resource
   *               - action
   *             properties:
   *               name:
   *                 type: string
   *               resource:
   *                 type: string
   *               action:
   *                 type: string
   *               description:
   *                 type: string
   *               tenantId:
   *                 type: string
   *     responses:
   *       201:
   *         description: Permission created successfully
   */
  async create(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Super admin can specify tenantId in body, otherwise use their tenant
      const tenantId = req.user?.isSuperAdmin && req.body.tenantId
        ? req.body.tenantId
        : req.user?.tenantId;

      if (!tenantId) {
        return ResponseFormatter.error(res, 'Tenant ID is required', 400, ['Tenant ID must be provided']);
      }

      const dto = {
        ...req.body,
        tenantId,
      };

      const result = await this.createPermissionUseCase.execute(dto);
      return ResponseFormatter.success(res, result, 'Permission created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Super admin can specify tenantId in body, otherwise use their tenant
      const tenantId = req.user?.isSuperAdmin && req.body.tenantId
        ? req.body.tenantId
        : req.user?.tenantId;

      const result = await this.updatePermissionUseCase.execute(req.params.id, req.body, tenantId);
      return ResponseFormatter.success(res, result, 'Permission updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Super admin can specify tenantId in query, otherwise use their tenant
      const tenantId = req.user?.isSuperAdmin && req.query.tenantId
        ? req.query.tenantId as string
        : req.user?.tenantId;

      await this.deletePermissionUseCase.execute(req.params.id, tenantId || undefined);
      return ResponseFormatter.success(res, null, 'Permission deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}
