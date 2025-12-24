import { IRoleRepository } from '../../../domain/repositories/irole-repository';
import { RoleResponseDto } from '../../dto/role.dto';
import { PaginationParams, PaginatedResult } from '../../../shared/types/pagination';

export class GetRolesUseCase {
  constructor(private roleRepository: IRoleRepository) {}

  async execute(tenantId: string, pagination?: PaginationParams): Promise<PaginatedResult<RoleResponseDto>> {
    const result = await this.roleRepository.getRolesWithPermissions(tenantId, pagination);

    return {
      data: result.data.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      tenantId: role.tenantId,
      permissions: role.permissions.map((perm) => ({
        id: perm.id,
        name: perm.name,
        resource: perm.resource,
        action: perm.action,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}

