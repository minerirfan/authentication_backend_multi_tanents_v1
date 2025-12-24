export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds: string[];
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  roleIds?: string[];
}

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string | null;
  roles: Array<{
    id: string;
    name: string;
    description: string | null;
    permissions?: Array<{
      id: string;
      name: string;
      resource: string;
      action: string;
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

