import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import { container } from '../../../infrastructure/di/container';
import { ResponseFormatter } from '../responses/response-formatter';
import { parsePaginationParams } from '../../../shared/utils/pagination';
import { CreateUserUseCase } from '../../../application/use-cases/user/create-user.use-case';
import { GetUsersUseCase } from '../../../application/use-cases/user/get-users.use-case';
import { GetUserUseCase } from '../../../application/use-cases/user/get-user.use-case';
import { UpdateUserUseCase } from '../../../application/use-cases/user/update-user.use-case';
import { DeleteUserUseCase } from '../../../application/use-cases/user/delete-user.use-case';

export class UserController {
  private createUserUseCase: CreateUserUseCase;
  private getUsersUseCase: GetUsersUseCase;
  private getUserUseCase: GetUserUseCase;
  private updateUserUseCase: UpdateUserUseCase;
  private deleteUserUseCase: DeleteUserUseCase;

  constructor() {
    this.createUserUseCase = container.get<CreateUserUseCase>('CreateUserUseCase');
    this.getUsersUseCase = container.get<GetUsersUseCase>('GetUsersUseCase');
    this.getUserUseCase = container.get<GetUserUseCase>('GetUserUseCase');
    this.updateUserUseCase = container.get<UpdateUserUseCase>('UpdateUserUseCase');
    this.deleteUserUseCase = container.get<DeleteUserUseCase>('DeleteUserUseCase');
  }

  /**
   * @swagger
   * /api/v1/users:
   *   post:
   *     summary: Create new user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *               - roleIds
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *                 minLength: 8
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               roleIds:
   *                 type: array
   *                 items:
   *                   type: string
   *               tenantId:
   *                 type: string
   *     responses:
   *       201:
   *         description: User created successfully
   */
  async create(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Super admin can specify tenantId in request body, otherwise use their tenant
      const tenantId = req.user?.isSuperAdmin && req.body.tenantId 
        ? req.body.tenantId 
        : req.tenantId;
      
      const result = await this.createUserUseCase.execute(req.body, tenantId);
      return ResponseFormatter.success(res, result, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /api/v1/users:
   *   get:
   *     summary: Get all users
   *     tags: [Users]
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
   *         description: Users retrieved successfully
   */
  async getMe(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const result = await this.getUserUseCase.execute(req.user!.userId, req.tenantId!);
      return ResponseFormatter.success(res, result, 'Current user retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Super admin can specify tenantId in query params, otherwise use their tenant
      const tenantId = req.user?.isSuperAdmin && req.query.tenantId 
        ? req.query.tenantId as string
        : req.tenantId;
      
      const pagination = parsePaginationParams(req);
      const result = await this.getUsersUseCase.execute(tenantId!, pagination);
      return ResponseFormatter.success(res, result, 'Users retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Super admin can specify tenantId in query params, otherwise use their tenant
      const tenantId = req.user?.isSuperAdmin && req.query.tenantId 
        ? req.query.tenantId as string
        : req.tenantId;
      
      const result = await this.getUserUseCase.execute(req.params.id, tenantId!);
      return ResponseFormatter.success(res, result, 'User retrieved successfully', 200);
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
      
      const result = await this.updateUserUseCase.execute(
        req.params.id,
        req.body,
        tenantId!
      );
      return ResponseFormatter.success(res, result, 'User updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // Super admin can specify tenantId in query params, otherwise use their tenant
      const tenantId = req.user?.isSuperAdmin && req.query.tenantId 
        ? req.query.tenantId as string
        : req.tenantId;
      
      await this.deleteUserUseCase.execute(req.params.id, tenantId!);
      return ResponseFormatter.success(res, null, 'User deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

