import { IPermissionRepository } from '../../../domain/repositories/ipermission-repository';
import { NotFoundException } from '../../../domain/exceptions/domain-exceptions';

export class DeletePermissionUseCase {
  constructor(private permissionRepository: IPermissionRepository) {}

  async execute(id: string, tenantId?: string): Promise<void> {
    // Check if permission exists (and belongs to tenant if specified)
    const existing = await this.permissionRepository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundException('Permission', id);
    }

    await this.permissionRepository.delete(id);
  }
}

