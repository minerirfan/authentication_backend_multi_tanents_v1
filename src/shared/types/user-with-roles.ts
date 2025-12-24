// Type for user with roles and permissions
export interface UserWithRoles {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string | null;
  isSuperAdmin: boolean;
  roles: Array<{
    id: string;
    name: string;
    description: string | null;
    permissions: Array<{
      id: string;
      name: string;
      resource: string;
      action: string;
    }>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

