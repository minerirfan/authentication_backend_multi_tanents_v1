import { Request } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  statusCode: number;
  errors?: string[];
  stackTrace?: string[];
  results?: T;
}

export interface JwtPayload {
  userId: string;
  tenantId: string | null;
  email: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
}

export interface RequestWithUser extends Request {
  user?: JwtPayload;
  tenantId?: string;
}

export * from './pagination';
export * from './user-with-roles';
export * from './role-with-permissions';

