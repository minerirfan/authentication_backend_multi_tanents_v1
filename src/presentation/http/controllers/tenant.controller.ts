import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import { container } from '../../../infrastructure/di/container';
import { ResponseFormatter } from '../responses/response-formatter';
import { parsePaginationParams } from '../../../shared/utils/pagination';
import { CreateTenantUseCase } from '../../../application/use-cases/tenant/create-tenant.use-case';
import { GetTenantsUseCase } from '../../../application/use-cases/tenant/get-tenants.use-case';
import { UpdateTenantUseCase } from '../../../application/use-cases/tenant/update-tenant.use-case';
import { DeleteTenantUseCase } from '../../../application/use-cases/tenant/delete-tenant.use-case';

export class TenantController {
  private createTenantUseCase: CreateTenantUseCase;
  private getTenantsUseCase: GetTenantsUseCase;
  private updateTenantUseCase: UpdateTenantUseCase;
  private deleteTenantUseCase: DeleteTenantUseCase;

  constructor() {
    this.createTenantUseCase = container.get<CreateTenantUseCase>('CreateTenantUseCase');
    this.getTenantsUseCase = container.get<GetTenantsUseCase>('GetTenantsUseCase');
    this.updateTenantUseCase = container.get<UpdateTenantUseCase>('UpdateTenantUseCase');
    this.deleteTenantUseCase = container.get<DeleteTenantUseCase>('DeleteTenantUseCase');
  }

  async create(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const result = await this.createTenantUseCase.execute(req.body);
      return ResponseFormatter.success(res, result, 'Tenant created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const pagination = parsePaginationParams(req);
      const result = await this.getTenantsUseCase.execute(pagination);
      return ResponseFormatter.success(res, result, 'Tenants retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async update(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const result = await this.updateTenantUseCase.execute(req.params.id, req.body);
      return ResponseFormatter.success(res, result, 'Tenant updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: RequestWithUser, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await this.deleteTenantUseCase.execute(req.params.id);
      return ResponseFormatter.success(res, null, 'Tenant deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

