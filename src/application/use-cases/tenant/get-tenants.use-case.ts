import { ITenantRepository } from '../../../domain/repositories/itenant-repository';
import { TenantEntity } from '../../../domain/entities/tenant.entity';
import { PaginationParams, PaginatedResult } from '../../../shared/types/pagination';

export class GetTenantsUseCase {
  constructor(private tenantRepository: ITenantRepository) {}

  async execute(pagination?: PaginationParams): Promise<PaginatedResult<TenantEntity>> {
    return await this.tenantRepository.findAll(pagination);
  }
}

