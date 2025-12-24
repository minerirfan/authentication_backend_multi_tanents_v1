import { IRoleRepository } from '../../../domain/repositories/irole-repository';
import { IPermissionRepository } from '../../../domain/repositories/ipermission-repository';
import { RoleEntity } from '../../../domain/entities/role.entity';
import { ConflictException, NotFoundException } from '../../../domain/exceptions/domain-exceptions';
import { CreateRoleDto, RoleResponseDto } from '../../dto/role.dto';
import { v4 as uuidv4 } from 'uuid';

export class CreateRoleUseCase {
  constructor(
    private roleRepository: IRoleRepository,
    private permissionRepository: IPermissionRepository
  ) {}

  async execute(dto: CreateRoleDto, tenantId: string): Promise<RoleResponseDto> {
    // Check if role name already exists in tenant
    const existingRole = await this.roleRepository.findByName(dto.name, tenantId);
    if (existingRole) {
      throw new ConflictException('Role with this name already exists');
    }

    // Validate permissions exist
    for (const permissionId of dto.permissionIds) {
      const permission = await this.permissionRepository.findById(permissionId);
      if (!permission) {
        throw new NotFoundException('Permission', permissionId);
      }
    }

    // Create role
    const role = new RoleEntity(
      uuidv4(),
      dto.name,
      dto.description || null,
      tenantId,
      new Date(),
      new Date(),
      dto.permissionIds
    );
    await this.roleRepository.create(role);

    // Return role with permissions
    const roleWithPermissions = await this.roleRepository.getRoleWithPermissions(role.id, tenantId);

    if (!roleWithPermissions) {
      throw new NotFoundException('Role', role.id);
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

