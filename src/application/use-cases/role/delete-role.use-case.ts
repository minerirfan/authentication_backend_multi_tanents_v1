import { IRoleRepository } from '../../../domain/repositories/irole-repository';
import { NotFoundException } from '../../../domain/exceptions/domain-exceptions';

export class DeleteRoleUseCase {
  constructor(private roleRepository: IRoleRepository) {}

  async execute(roleId: string, tenantId: string): Promise<void> {
    const role = await this.roleRepository.findById(roleId, tenantId);
    if (!role) {
      throw new NotFoundException('Role', roleId);
    }

    await this.roleRepository.delete(roleId, tenantId);
  }
}

