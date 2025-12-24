import { IRoleRepository } from '../../../domain/repositories/irole-repository';
import { IPermissionRepository } from '../../../domain/repositories/ipermission-repository';
import { RoleEntity } from '../../../domain/entities/role.entity';
import { NotFoundException, ConflictException } from '../../../domain/exceptions/domain-exceptions';
import { UpdateRoleDto, RoleResponseDto } from '../../dto/role.dto';

export class UpdateRoleUseCase {
  constructor(
    private roleRepository: IRoleRepository,
    private permissionRepository: IPermissionRepository
  ) {}

  async execute(roleId: string, dto: UpdateRoleDto, tenantId: string): Promise<RoleResponseDto> {
    const role = await this.roleRepository.findById(roleId, tenantId);
    if (!role) {
      throw new NotFoundException('Role', roleId);
    }

    // Check name uniqueness if updating name
    if (dto.name && dto.name !== role.name) {
      const existingRole = await this.roleRepository.findByName(dto.name, tenantId);
      if (existingRole && existingRole.id !== roleId) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    // Validate permissions if updating
    if (dto.permissionIds) {
      for (const permissionId of dto.permissionIds) {
        const permission = await this.permissionRepository.findById(permissionId);
        if (!permission) {
          throw new NotFoundException('Permission', permissionId);
        }
      }
    }

    // Update role
    const updatedRole = new RoleEntity(
      role.id,
      dto.name ?? role.name,
      dto.description ?? role.description,
      role.tenantId,
      role.createdAt,
      new Date(),
      dto.permissionIds ?? role.permissionIds
    );

    await this.roleRepository.update(updatedRole);

    // Update role permissions if provided
    // The update method in RoleRepository already handles permission updates
    // But if we need to update separately, we can use assignPermissions
    if (dto.permissionIds) {
      // Remove all existing permissions first
      const currentRole = await this.roleRepository.findById(roleId, tenantId);
      if (currentRole && currentRole.permissionIds.length > 0) {
        await this.roleRepository.removePermissions(roleId, currentRole.permissionIds);
      }
      // Assign new permissions
      await this.roleRepository.assignPermissions(roleId, dto.permissionIds);
    }

    // Return updated role
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

