import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { IUserRoleRepository } from '../../../domain/repositories/iuser-role-repository';
import { AdminLimitService } from '../../../domain/services/admin-limit.service';
import { NotFoundException, ForbiddenException } from '../../../domain/exceptions/domain-exceptions';
import { ROLE_NAMES } from '../../../domain/constants/role-names';

export class DeleteUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private userRoleRepository: IUserRoleRepository,
    private adminLimitService: AdminLimitService
  ) {}

  async execute(userId: string, tenantId?: string | null): Promise<void> {
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new NotFoundException('User', userId);
    }
    
    // If tenantId was provided, verify user belongs to that tenant (unless super admin)
    if (tenantId && user.tenantId !== tenantId && !user.isSuperAdmin) {
      throw new NotFoundException('User', userId);
    }
    
    // Use user's tenantId if not provided (for super admin operations)
    const effectiveTenantId = tenantId || user.tenantId;
    if (!effectiveTenantId && !user.isSuperAdmin) {
      throw new NotFoundException('User', userId);
    }
    
    // Super admin cannot be deleted through this endpoint
    if (user.isSuperAdmin) {
      throw new ForbiddenException('Super admin users cannot be deleted');
    }

    // Check if user is an admin and if there's only one admin in the tenant
    if (effectiveTenantId) {
      const userWithRoles = await this.userRoleRepository.getUserWithRoles(userId);
      const isAdmin = userWithRoles?.roles.some((r) => r.name === ROLE_NAMES.ADMIN) || false;
      
      if (isAdmin) {
        await this.adminLimitService.validateNotLastAdmin(effectiveTenantId, this.userRepository);
      }
    }

    await this.userRepository.delete(userId, effectiveTenantId!);
  }
}

