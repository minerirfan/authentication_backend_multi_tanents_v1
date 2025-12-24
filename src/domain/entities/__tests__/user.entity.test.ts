import { UserEntity } from '../user.entity';
import { Email } from '../../value-objects/email';
import { Password } from '../../value-objects/password';

describe('UserEntity', () => {
  const createUser = (overrides?: {
    id?: string;
    email?: Email;
    password?: Password;
    firstName?: string;
    lastName?: string;
    tenantId?: string | null;
    isSuperAdmin?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }) => {
    return new UserEntity(
      overrides?.id || 'user-1',
      overrides?.email || new Email('test@example.com'),
      overrides?.password || new Password('hashedPassword', true),
      overrides?.firstName || 'John',
      overrides?.lastName || 'Doe',
      overrides?.tenantId !== undefined ? overrides.tenantId : 'tenant-1',
      overrides?.isSuperAdmin || false,
      overrides?.createdAt || new Date(),
      overrides?.updatedAt || new Date()
    );
  };

  describe('getFullName', () => {
    it('should return full name', () => {
      const user = createUser({ firstName: 'John', lastName: 'Doe' });
      expect(user.getFullName()).toBe('John Doe');
    });
  });

  describe('isSuperAdminUser', () => {
    it('should return true for super admin', () => {
      const user = createUser({ isSuperAdmin: true });
      expect(user.isSuperAdminUser()).toBe(true);
    });

    it('should return false for regular user', () => {
      const user = createUser({ isSuperAdmin: false });
      expect(user.isSuperAdminUser()).toBe(false);
    });
  });

  describe('canAccessTenant', () => {
    it('should return true for super admin accessing any tenant', () => {
      const user = createUser({ isSuperAdmin: true, tenantId: null });
      expect(user.canAccessTenant('tenant-1')).toBe(true);
      expect(user.canAccessTenant('tenant-2')).toBe(true);
      expect(user.canAccessTenant(null)).toBe(true);
    });

    it('should return true for user accessing own tenant', () => {
      const user = createUser({ tenantId: 'tenant-1' });
      expect(user.canAccessTenant('tenant-1')).toBe(true);
    });

    it('should return false for user accessing different tenant', () => {
      const user = createUser({ tenantId: 'tenant-1' });
      expect(user.canAccessTenant('tenant-2')).toBe(false);
    });
  });

  describe('belongsToTenant', () => {
    it('should return true if user belongs to tenant', () => {
      const user = createUser({ tenantId: 'tenant-1' });
      expect(user.belongsToTenant('tenant-1')).toBe(true);
    });

    it('should return false if user does not belong to tenant', () => {
      const user = createUser({ tenantId: 'tenant-1' });
      expect(user.belongsToTenant('tenant-2')).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true if user has role', () => {
      const user = createUser();
      expect(user.hasRole('admin', ['admin', 'user'])).toBe(true);
    });

    it('should return false if user does not have role', () => {
      const user = createUser();
      expect(user.hasRole('admin', ['user'])).toBe(false);
    });
  });

  describe('assignRoles', () => {
    it('should return empty array for super admin', () => {
      const user = createUser({ isSuperAdmin: true });
      expect(user.assignRoles(['admin'])).toEqual([]);
    });

    it('should return role IDs for regular user', () => {
      const user = createUser({ isSuperAdmin: false });
      expect(user.assignRoles(['role-1', 'role-2'])).toEqual(['role-1', 'role-2']);
    });
  });

  describe('canAssignRole', () => {
    it('should return false for super admin', () => {
      const user = createUser({ isSuperAdmin: true });
      expect(user.canAssignRole('admin', [])).toBe(false);
    });

    it('should return true if role not already assigned', () => {
      const user = createUser({ isSuperAdmin: false });
      expect(user.canAssignRole('admin', ['user'])).toBe(true);
    });

    it('should return false if role already assigned', () => {
      const user = createUser({ isSuperAdmin: false });
      expect(user.canAssignRole('admin', ['admin'])).toBe(false);
    });
  });
});

