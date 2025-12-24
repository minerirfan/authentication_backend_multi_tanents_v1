/**
 * Constants for role names
 * Centralized to avoid hardcoded strings throughout the codebase
 */
export const ROLE_NAMES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES];

