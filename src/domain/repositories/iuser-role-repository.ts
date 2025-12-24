import { UserWithRoles } from '../../shared/types/user-with-roles';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';

export interface IUserRoleRepository {
  /**
   * Assign roles to a user
   */
  assignRoles(userId: string, roleIds: string[]): Promise<void>;

  /**
   * Remove roles from a user
   */
  removeRoles(userId: string, roleIds: string[]): Promise<void>;

  /**
   * Remove all roles from a user
   */
  removeAllRoles(userId: string): Promise<void>;

  /**
   * Get user with roles and permissions
   */
  getUserWithRoles(userId: string): Promise<UserWithRoles | null>;

  /**
   * Get users with roles and permissions (paginated)
   */
  getUsersWithRoles(
    tenantId: string | null,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<UserWithRoles>>;

  /**
   * Get users with roles and permissions by role ID
   */
  getUsersByRole(roleId: string, tenantId: string): Promise<UserWithRoles[]>;
}

