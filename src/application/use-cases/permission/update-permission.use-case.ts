import { IPermissionRepository } from '../../../domain/repositories/ipermission-repository';
import { PermissionEntity } from '../../../domain/entities/permission.entity';
import { NotFoundException, ConflictException } from '../../../domain/exceptions/domain-exceptions';

export interface UpdatePermissionDto {
  name?: string;
  resource?: string;
  action?: string;
  description?: string;
}

export class UpdatePermissionUseCase {
  constructor(private permissionRepository: IPermissionRepository) {}

  async execute(id: string, dto: UpdatePermissionDto, tenantId?: string): Promise<PermissionEntity> {
    // Check if permission exists (and belongs to tenant if specified)
    const existing = await this.permissionRepository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundException('Permission', id);
    }

    // If name is being updated, check if new name already exists for this tenant
    if (dto.name && dto.name !== existing.name) {
      const nameExists = await this.permissionRepository.findByName(dto.name, existing.tenantId);
      if (nameExists) {
        throw new ConflictException('Permission with this name already exists for this tenant');
      }
    }

    // Update permission
    const updated = new PermissionEntity(
      existing.id,
      dto.name || existing.name,
      dto.resource || existing.resource,
      dto.action || existing.action,
      dto.description !== undefined ? dto.description : existing.description,
      existing.tenantId // Keep the same tenantId
    );

    return await this.permissionRepository.update(updated);
  }
}

