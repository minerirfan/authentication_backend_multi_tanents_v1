import { Email } from '../value-objects/email';
import { Password } from '../value-objects/password';

/**
 * User entity representing a user in the system
 * Acts as an aggregate root managing user-role relationships
 */
export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: Email,
    private password: Password,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly tenantId: string | null,
    public readonly isSuperAdmin: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  updatePassword(newPassword: Password): void {
    this.password = newPassword;
  }

  getPassword(): Password {
    return this.password;
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  isSuperAdminUser(): boolean {
    return this.isSuperAdmin;
  }

  /**
   * Check if the user can access a specific tenant
   * @param tenantId - The tenant ID to check access for
   * @returns true if the user can access the tenant
   */
  canAccessTenant(tenantId: string | null): boolean {
    // Super admins can access all tenants
    if (this.isSuperAdmin) {
      return true;
    }
    // Regular users can only access their own tenant
    return this.tenantId === tenantId;
  }

  /**
   * Check if the user has a specific role
   * Note: This method doesn't check the database - it's a helper for business logic
   * For actual role checking, use the UserRoleRepository
   * @param roleName - The role name to check
   * @param userRoles - Array of role names the user has
   * @returns true if the user has the role
   */
  hasRole(roleName: string, userRoles: string[]): boolean {
    return userRoles.includes(roleName);
  }

  /**
   * Check if the user belongs to a tenant
   * @param tenantId - The tenant ID to check
   * @returns true if the user belongs to the tenant
   */
  belongsToTenant(tenantId: string | null): boolean {
    return this.tenantId === tenantId;
  }

  /**
   * Aggregate Root: User manages its role relationships
   * This method represents the user's ability to have roles assigned
   * Note: Actual persistence is handled by UserRoleRepository, but this represents the domain concept
   * @param roleIds - Array of role IDs to be assigned
   * @returns Array of role IDs that should be assigned (for use by repository)
   */
  assignRoles(roleIds: string[]): string[] {
    // Business rule: Super admins don't need explicit roles
    if (this.isSuperAdmin) {
      return [];
    }
    // Return the role IDs that should be assigned
    return roleIds;
  }

  /**
   * Aggregate Root: Check if user can have a role assigned
   * @param roleId - The role ID to check
   * @param userRoles - Current role IDs the user has
   * @returns true if the role can be assigned
   */
  canAssignRole(roleId: string, userRoles: string[]): boolean {
    // Super admins don't need explicit roles
    if (this.isSuperAdmin) {
      return false;
    }
    // Can assign if not already assigned
    return !userRoles.includes(roleId);
  }

  /**
   * Aggregate Root: Remove a role from the user
   * @param roleId - The role ID to remove
   * @param userRoles - Current role IDs the user has
   * @returns true if the role should be removed (for use by repository)
   */
  removeRole(roleId: string, userRoles: string[]): boolean {
    // Super admins don't have explicit roles
    if (this.isSuperAdmin) {
      return false;
    }
    // Can remove if currently assigned
    return userRoles.includes(roleId);
  }
}

