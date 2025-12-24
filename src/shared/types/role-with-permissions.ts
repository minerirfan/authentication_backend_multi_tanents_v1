// Type for role with full permission details
export interface RoleWithPermissions {
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

