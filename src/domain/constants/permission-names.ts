/**
 * Constants for permission names
 * Centralized to avoid hardcoded strings throughout the codebase
 */
export const PERMISSION_NAMES = {
  // User permissions
  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  
  // Role permissions
  ROLE_CREATE: 'role.create',
  ROLE_READ: 'role.read',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',
  
  // Permission permissions
  PERMISSION_CREATE: 'permission.create',
  PERMISSION_READ: 'permission.read',
  PERMISSION_UPDATE: 'permission.update',
  PERMISSION_DELETE: 'permission.delete',
} as const;

export type PermissionName = typeof PERMISSION_NAMES[keyof typeof PERMISSION_NAMES];

/**
 * Default permissions that are created for each tenant
 */
export const DEFAULT_PERMISSIONS = [
  { name: PERMISSION_NAMES.USER_CREATE, resource: 'user', action: 'create', description: 'Create users' },
  { name: PERMISSION_NAMES.USER_READ, resource: 'user', action: 'read', description: 'Read users' },
  { name: PERMISSION_NAMES.USER_UPDATE, resource: 'user', action: 'update', description: 'Update users' },
  { name: PERMISSION_NAMES.USER_DELETE, resource: 'user', action: 'delete', description: 'Delete users' },
  { name: PERMISSION_NAMES.ROLE_CREATE, resource: 'role', action: 'create', description: 'Create roles' },
  { name: PERMISSION_NAMES.ROLE_READ, resource: 'role', action: 'read', description: 'Read roles' },
  { name: PERMISSION_NAMES.ROLE_UPDATE, resource: 'role', action: 'update', description: 'Update roles' },
  { name: PERMISSION_NAMES.ROLE_DELETE, resource: 'role', action: 'delete', description: 'Delete roles' },
  { name: PERMISSION_NAMES.PERMISSION_CREATE, resource: 'permission', action: 'create', description: 'Create permissions' },
  { name: PERMISSION_NAMES.PERMISSION_READ, resource: 'permission', action: 'read', description: 'Read permissions' },
  { name: PERMISSION_NAMES.PERMISSION_UPDATE, resource: 'permission', action: 'update', description: 'Update permissions' },
  { name: PERMISSION_NAMES.PERMISSION_DELETE, resource: 'permission', action: 'delete', description: 'Delete permissions' },
];

