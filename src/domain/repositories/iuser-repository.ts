import { UserEntity } from '../entities/user.entity';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';

export interface IUserRepository {
  findById(id: string, tenantId?: string | null): Promise<UserEntity | null>;
  findByEmail(email: string, tenantId: string | null): Promise<UserEntity | null>;
  findAll(tenantId: string, pagination?: PaginationParams): Promise<PaginatedResult<UserEntity>>;
  create(user: UserEntity): Promise<UserEntity>;
  update(user: UserEntity): Promise<UserEntity>;
  delete(id: string, tenantId: string): Promise<void>;
  countAdmins(tenantId: string): Promise<number>;
  findUsersByRole(roleId: string, tenantId: string): Promise<UserEntity[]>;
}

