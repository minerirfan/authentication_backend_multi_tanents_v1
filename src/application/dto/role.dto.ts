export interface CreateRoleDto {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface RoleResponseDto {
  id: string;
  name: string;
  description: string | null;
  tenantId: string;
  permissions: Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

