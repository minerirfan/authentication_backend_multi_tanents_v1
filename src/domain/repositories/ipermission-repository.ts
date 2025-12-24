import { PermissionEntity } from '../entities/permission.entity';

export interface IPermissionRepository {
  findById(id: string, tenantId?: string): Promise<PermissionEntity | null>;
  findByName(name: string, tenantId: string): Promise<PermissionEntity | null>;
  findByIds(ids: string[]): Promise<PermissionEntity[]>;
  findAll(tenantId?: string): Promise<PermissionEntity[]>;
  findByResource(resource: string, tenantId: string): Promise<PermissionEntity[]>;
  create(permission: PermissionEntity): Promise<PermissionEntity>;
  update(permission: PermissionEntity): Promise<PermissionEntity>;
  delete(id: string): Promise<void>;
}

