import { IPermissionRepository } from '../../../domain/repositories/ipermission-repository';
import { PermissionEntity } from '../../../domain/entities/permission.entity';

export interface PermissionResponseDto {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
}

export class GetPermissionsUseCase {
  constructor(private permissionRepository: IPermissionRepository) {}

  async execute(tenantId?: string): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionRepository.findAll(tenantId);

    return permissions.map((permission) => ({
      id: permission.id,
      name: permission.name,
      resource: permission.resource,
      action: permission.action,
      description: permission.description,
    }));
  }
}

