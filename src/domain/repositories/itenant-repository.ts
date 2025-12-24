import { TenantEntity } from '../entities/tenant.entity';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';

export interface ITenantRepository {
  findById(id: string): Promise<TenantEntity | null>;
  findBySlug(slug: string): Promise<TenantEntity | null>;
  findAll(pagination?: PaginationParams): Promise<PaginatedResult<TenantEntity>>;
  create(tenant: TenantEntity): Promise<TenantEntity>;
  update(tenant: TenantEntity): Promise<TenantEntity>;
  delete(id: string): Promise<void>;
}

