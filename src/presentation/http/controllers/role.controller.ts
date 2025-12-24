import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import { container } from '../../../infrastructure/di/container';
import { ResponseFormatter } from '../responses/response-formatter';
import { parsePaginationParams } from '../../../shared/utils/pagination';
import { CreateRoleUseCase } from '../../../application/use-cases/role/create-role.use-case';
import { GetRolesUseCase } from '../../../application/use-cases/role/get-roles.use-case';
import { GetRoleUseCase } from '../../../application/use-cases/role/get-role.use-case';
import { UpdateRoleUseCase } from '../../../application/use-cases/role/update-role.use-case';
import { DeleteRoleUseCase } from '../../../application/use-cases/role/delete-role.use-case';

export class RoleController {
  private createRoleUseCase: CreateRoleUseCase;
  private getRolesUseCase: GetRolesUseCase;
  private getRoleUseCase: GetRoleUseCase;
  private updateRoleUseCase: UpdateRoleUseCase;
  private deleteRoleUseCase: DeleteRoleUseCase;

  constructor() {
    this.createRoleUseCase = container.get<CreateRoleUseCase>('CreateRoleUseCase');
    this.getRolesUseCase = container.get<GetRolesUseCase>('GetRolesUseCase');
    this.getRoleUseCase = container.get<GetRoleUseCase>('GetRoleUseCase');
    this.updateRoleUseCase = container.get<UpdateRoleUseCase>('UpdateRoleUseCase');
    this.deleteRoleUseCase = container.get<DeleteRoleUseCase>('DeleteRoleUseCase');
  }

  /**
   * @swagger
   * /api/v1/roles:
   *   post:
   *     summary: Create new role
   *     tags: [Roles]
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
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *               permissionIds:
   *                 type: array
   *                 items:
   *                   type: string
   *               tenantId:
   *                 type: string
   *     responses:
   *       201:
   *         description: Role created successfully
   */
  async create(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Super admin can specify tenantId in request body, otherwise use their tenant
      const tenantId = req.user?.isSuperAdmin && req.body.tenantId 
        ? req.body.tenantId 
        : req.tenantId;
      
      if (!tenantId) {
        return ResponseFormatter.error(res, 'Tenant ID is required', 400);
      }
      
      const result = await this.createRoleUseCase.execute(req.body, tenantId);
      return ResponseFormatter.success(res, result, 'Role created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/roles:
   *   get:
   *     summary: Get all roles
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: tenantId
   *         schema:
   *           type: string
   *         description: Tenant ID (super admin only)
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Items per page
   *     responses:
   *       200:
   *         description: Roles retrieved successfully
   */
  async getAll(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Super admin can access all roles, tenant admin only their tenant
      const tenantId = req.user?.isSuperAdmin && req.query.tenantId 
        ? req.query.tenantId as string
        : req.tenantId;
      
      if (!tenantId) {
        return ResponseFormatter.error(res, 'Tenant ID is required', 400);
      }
      
      const pagination = parsePaginationParams(req);
      const result = await this.getRolesUseCase.execute(tenantId, pagination);
      return ResponseFormatter.success(res, result, 'Roles retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Super admin can access any role, tenant admin only their tenant
      const tenantId = req.user?.isSuperAdmin && req.query.tenantId 
        ? req.query.tenantId as string
        : req.tenantId;
      
      if (!tenantId) {
        return ResponseFormatter.error(res, 'Tenant ID is required', 400);
      }
      
      const result = await this.getRoleUseCase.execute(req.params.id, tenantId);
      return ResponseFormatter.success(res, result, 'Role retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async update(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Super admin can specify tenantId in request body, otherwise use their tenant
      const tenantId = req.user?.isSuperAdmin && req.body.tenantId 
        ? req.body.tenantId 
        : req.tenantId;
      
      if (!tenantId) {
        return ResponseFormatter.error(res, 'Tenant ID is required', 400);
      }
      
      const result = await this.updateRoleUseCase.execute(
        req.params.id,
        req.body,
        tenantId
      );
      return ResponseFormatter.success(res, result, 'Role updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Super admin can specify tenantId in query params or body, otherwise use their tenant
      const tenantId = req.user?.isSuperAdmin && (req.query.tenantId || req.body.tenantId)
        ? (req.query.tenantId as string || req.body.tenantId)
        : req.tenantId;
      
      if (!tenantId) {
        return ResponseFormatter.error(res, 'Tenant ID is required', 400);
      }
      
      await this.deleteRoleUseCase.execute(req.params.id, tenantId);
      return ResponseFormatter.success(res, null, 'Role deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

