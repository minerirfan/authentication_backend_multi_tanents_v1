import { IRoleRepository } from '../../../domain/repositories/irole-repository';
import { NotFoundException } from '../../../domain/exceptions/domain-exceptions';
import { RoleResponseDto } from '../../dto/role.dto';

export class GetRoleUseCase {
  constructor(private roleRepository: IRoleRepository) {}

  async execute(roleId: string, tenantId: string): Promise<RoleResponseDto> {
    const roleWithPermissions = await this.roleRepository.getRoleWithPermissions(roleId, tenantId);
    if (!roleWithPermissions) {
      throw new NotFoundException('Role', roleId);
    }

    return {
      id: roleWithPermissions.id,
      name: roleWithPermissions.name,
      description: roleWithPermissions.description,
      tenantId: roleWithPermissions.tenantId,
      permissions: roleWithPermissions.permissions.map((perm) => ({
        id: perm.id,
        name: perm.name,
        resource: perm.resource,
        action: perm.action,
      })),
      createdAt: roleWithPermissions.createdAt,
      updatedAt: roleWithPermissions.updatedAt,
    };
  }
}

