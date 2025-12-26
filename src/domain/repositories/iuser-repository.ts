import { UserEntity } from '../entities/user.entity';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';

export interface IUserRepository {
  findById(id: string, tenantId?: string | null): Promise<UserEntity | null>;
  findByEmail(email: string, tenantId: string | null): Promise<UserEntity | null>;
  /**
   * Find minimal user data by email (no tenant filter)
   * Used for login to check if email exists across all tenants
   * @returns User ID, email, and tenantId only (no password)
   */
  findByEmailOnly(email: string): Promise<{ id: string; email: string; tenantId: string | null } | null>;
  findAll(tenantId: string, pagination?: PaginationParams): Promise<PaginatedResult<UserEntity>>;
  create(user: UserEntity): Promise<UserEntity>;
  update(user: UserEntity): Promise<UserEntity>;
  delete(id: string, tenantId: string): Promise<void>;
  countAdmins(tenantId: string): Promise<number>;
  findUsersByRole(roleId: string, tenantId: string): Promise<UserEntity[]>;
}

