import { RoleEntity } from '../entities/role.entity';
import { RoleWithPermissions } from '../../shared/types/role-with-permissions';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';

export interface IRoleRepository {
  findById(id: string, tenantId: string): Promise<RoleEntity | null>;
  findByName(name: string, tenantId: string): Promise<RoleEntity | null>;
  findByIds(ids: string[], tenantId?: string): Promise<RoleWithPermissions[]>;
  findAll(tenantId: string, pagination?: PaginationParams): Promise<PaginatedResult<RoleEntity>>;
  create(role: RoleEntity): Promise<RoleEntity>;
  update(role: RoleEntity): Promise<RoleEntity>;
  delete(id: string, tenantId: string): Promise<void>;
  assignPermissions(roleId: string, permissionIds: string[]): Promise<void>;
  removePermissions(roleId: string, permissionIds: string[]): Promise<void>;
  getRoleWithPermissions(id: string, tenantId: string): Promise<RoleWithPermissions | null>;
  getRolesWithPermissions(tenantId: string, pagination?: PaginationParams): Promise<PaginatedResult<RoleWithPermissions>>;
}

