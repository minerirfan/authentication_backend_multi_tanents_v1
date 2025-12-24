import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { IUserRoleRepository } from '../../../domain/repositories/iuser-role-repository';
import { UserResponseDto } from '../../dto/user.dto';
import { PaginationParams, PaginatedResult } from '../../../shared/types/pagination';

export class GetUsersUseCase {
  constructor(
    private userRepository: IUserRepository,
    private userRoleRepository: IUserRoleRepository
  ) {}

  async execute(tenantId?: string | null, pagination?: PaginationParams): Promise<PaginatedResult<UserResponseDto>> {
    // Get users with roles using UserRoleRepository
    const result = await this.userRoleRepository.getUsersWithRoles(tenantId || null, pagination);
    
    return {
      data: result.data.map((userWithRoles) => ({
      id: userWithRoles.id,
      email: userWithRoles.email,
      firstName: userWithRoles.firstName,
      lastName: userWithRoles.lastName,
      tenantId: userWithRoles.tenantId,
      roles: userWithRoles.roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.permissions.map((perm) => ({
          id: perm.id,
          name: perm.name,
          resource: perm.resource,
          action: perm.action,
        })),
      })),
      createdAt: userWithRoles.createdAt,
      updatedAt: userWithRoles.updatedAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
