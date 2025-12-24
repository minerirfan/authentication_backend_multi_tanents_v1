import { RoleEntity } from '../role.entity';
import { PermissionEntity } from '../permission.entity';
import { ROLE_NAMES } from '../../constants/role-names';

describe('RoleEntity', () => {
  const createRole = (overrides?: Partial<RoleEntity>) => {
    return new RoleEntity(
      overrides?.id || 'role-1',
      overrides?.name || 'user',
      overrides?.description || null,
      overrides?.tenantId || 'tenant-1',
      overrides?.createdAt || new Date(),
      overrides?.updatedAt || new Date(),
      overrides?.permissionIds || []
    );
  };

  const createPermission = (tenantId: string = 'tenant-1') => {
    return new PermissionEntity(
      'perm-1',
      'user.create',
      'user',
      'create',
      'Create users',
      tenantId
    );
  };

  describe('canAssignPermission', () => {
    it('should return true for admin role', () => {
      const role = createRole({ name: ROLE_NAMES.ADMIN });
      const permission = createPermission();
      expect(role.canAssignPermission(permission)).toBe(true);
    });

    it('should return true if permission not already assigned', () => {
      const role = createRole({ name: 'user', permissionIds: [] });
      const permission = createPermission();
      expect(role.canAssignPermission(permission)).toBe(true);
    });

    it('should return false if permission already assigned', () => {
      const role = createRole({ name: 'user', permissionIds: ['perm-1'] });
      const permission = createPermission();
      expect(role.canAssignPermission(permission)).toBe(false);
    });

    it('should return false if permission belongs to different tenant', () => {
      const role = createRole({ name: 'user', tenantId: 'tenant-1' });
      const permission = createPermission('tenant-2');
      expect(role.canAssignPermission(permission)).toBe(false);
    });
  });

  describe('assignPermission', () => {
    it('should add permission if not already assigned', () => {
      const role = createRole({ permissionIds: [] });
      role.assignPermission('perm-1');
      expect(role.getPermissionIds()).toContain('perm-1');
    });

    it('should not add duplicate permission', () => {
      const role = createRole({ permissionIds: ['perm-1'] });
      role.assignPermission('perm-1');
      expect(role.getPermissionIds().filter(id => id === 'perm-1').length).toBe(1);
    });
  });

  describe('removePermission', () => {
    it('should remove permission if assigned', () => {
      const role = createRole({ permissionIds: ['perm-1', 'perm-2'] });
      role.removePermission('perm-1');
      expect(role.getPermissionIds()).not.toContain('perm-1');
      expect(role.getPermissionIds()).toContain('perm-2');
    });

    it('should not throw if permission not assigned', () => {
      const role = createRole({ permissionIds: ['perm-2'] });
      expect(() => role.removePermission('perm-1')).not.toThrow();
    });
  });

  describe('hasPermission', () => {
    it('should return true if permission is assigned', () => {
      const role = createRole({ permissionIds: ['perm-1'] });
      expect(role.hasPermission('perm-1')).toBe(true);
    });

    it('should return false if permission is not assigned', () => {
      const role = createRole({ permissionIds: ['perm-2'] });
      expect(role.hasPermission('perm-1')).toBe(false);
    });
  });
});

