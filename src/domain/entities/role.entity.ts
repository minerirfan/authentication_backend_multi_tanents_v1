import { PermissionEntity } from './permission.entity';
import { ROLE_NAMES } from '../constants/role-names';

/**
 * Role entity representing a role in the system
 * Contains business logic for permission management
 */
export class RoleEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly tenantId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly permissionIds: string[] = []
  ) { }

  /**
   * Check if a permission can be assigned to this role
   * @param permission - The permission to check
   * @returns true if the permission can be assigned
   */
  canAssignPermission(permission: PermissionEntity): boolean {
    // Admin roles can have all permissions
    if (this.name === ROLE_NAMES.ADMIN) {
      return true;
    }
    // Check if permission belongs to the same tenant
    if (permission.tenantId !== this.tenantId) {
      return false;
    }
    // Check if permission is already assigned
    return !this.permissionIds.includes(permission.id);
  }

  /**
   * Assign a permission to this role
   * @param permissionId - The ID of the permission to assign
   */
  assignPermission(permissionId: string): void {
    if (!this.permissionIds.includes(permissionId)) {
      this.permissionIds.push(permissionId);
    }
  }

  /**
   * Remove a permission from this role
   * @param permissionId - The ID of the permission to remove
   */
  removePermission(permissionId: string): void {
    const index = this.permissionIds.indexOf(permissionId);
    if (index > -1) {
      this.permissionIds.splice(index, 1);
    }
  }

  /**
   * Get all permission IDs assigned to this role
   * @returns Array of permission IDs
   */
  getPermissionIds(): string[] {
    return [...this.permissionIds];
  }

  /**
   * Check if this role has a specific permission
   * @param permissionId - The permission ID to check
   * @returns true if the role has the permission
   */
  hasPermission(permissionId: string): boolean {
    return this.permissionIds.includes(permissionId);
  }
}

