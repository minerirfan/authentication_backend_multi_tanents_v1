import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import { container } from '../../../infrastructure/di/container';
import { ResponseFormatter } from '../responses/response-formatter';
import { CreateUserProfileUseCase } from '../../../application/use-cases/user-profile/create-user-profile.use-case';
import { UpdateUserProfileUseCase } from '../../../application/use-cases/user-profile/update-user-profile.use-case';
import { GetUserProfileUseCase } from '../../../application/use-cases/user-profile/get-user-profile.use-case';

export class UserProfileController {
  private createUserProfileUseCase: CreateUserProfileUseCase;
  private updateUserProfileUseCase: UpdateUserProfileUseCase;
  private getUserProfileUseCase: GetUserProfileUseCase;

  constructor() {
    this.createUserProfileUseCase = container.get<CreateUserProfileUseCase>('CreateUserProfileUseCase');
    this.updateUserProfileUseCase = container.get<UpdateUserProfileUseCase>('UpdateUserProfileUseCase');
    this.getUserProfileUseCase = container.get<GetUserProfileUseCase>('GetUserProfileUseCase');
  }

  async create(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const tenantId = req.user?.isSuperAdmin && req.body.tenantId 
        ? req.body.tenantId 
        : req.tenantId;
      
      const dto = { ...req.body, userId: req.body.userId || req.params.userId };
      const result = await this.createUserProfileUseCase.execute(dto, tenantId!);
      return ResponseFormatter.success(res, result, 'User profile created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getByUserId(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const tenantId = req.user?.isSuperAdmin && req.query.tenantId 
        ? req.query.tenantId as string
        : req.tenantId;
      
      const result = await this.getUserProfileUseCase.execute(req.params.userId, tenantId!);
      return ResponseFormatter.success(res, result, 'User profile retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async update(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const tenantId = req.user?.isSuperAdmin && req.body.tenantId 
        ? req.body.tenantId 
        : req.tenantId;
      
      const result = await this.updateUserProfileUseCase.execute(
        req.params.userId,
        req.body,
        tenantId!
      );
      return ResponseFormatter.success(res, result, 'User profile updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

