import { IPermissionRepository } from '../../../domain/repositories/ipermission-repository';
import { PermissionEntity } from '../../../domain/entities/permission.entity';
import { ConflictException } from '../../../domain/exceptions/domain-exceptions';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePermissionDto {
  name: string;
  resource: string;
  action: string;
  description?: string;
  tenantId: string;
}

export class CreatePermissionUseCase {
  constructor(private permissionRepository: IPermissionRepository) {}

  async execute(dto: CreatePermissionDto): Promise<PermissionEntity> {
    // Check if permission name already exists for this tenant
    const existing = await this.permissionRepository.findByName(dto.name, dto.tenantId);
    if (existing) {
      throw new ConflictException('Permission with this name already exists for this tenant');
    }

    // Create permission
    const permission = new PermissionEntity(
      uuidv4(),
      dto.name,
      dto.resource,
      dto.action,
      dto.description || null,
      dto.tenantId
    );

    return await this.permissionRepository.create(permission);
  }
}

