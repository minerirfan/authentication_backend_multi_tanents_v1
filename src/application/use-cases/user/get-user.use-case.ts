import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { IUserRoleRepository } from '../../../domain/repositories/iuser-role-repository';
import { NotFoundException } from '../../../domain/exceptions/domain-exceptions';
import { UserResponseDto } from '../../dto/user.dto';

export class GetUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private userRoleRepository: IUserRoleRepository
  ) {}

  async execute(userId: string, tenantId?: string | null): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new NotFoundException('User', userId);
    }
    
    // If tenantId was provided, verify user belongs to that tenant (unless super admin)
    if (tenantId && user.tenantId !== tenantId && !user.isSuperAdmin) {
      throw new NotFoundException('User', userId);
    }

    const userWithRoles = await this.userRoleRepository.getUserWithRoles(user.id);

    if (!userWithRoles) {
      throw new NotFoundException('User', user.id);
    }

    return {
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
    };
  }
}

