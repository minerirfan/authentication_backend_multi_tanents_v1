import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { IRoleRepository } from '../../../domain/repositories/irole-repository';
import { IUserRoleRepository } from '../../../domain/repositories/iuser-role-repository';
import { AdminLimitService } from '../../../domain/services/admin-limit.service';
import { IPasswordDomainService } from '../../../domain/services/ipassword-domain.service';
import { UserEntity } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email';
import { Password } from '../../../domain/value-objects/password';
import { NotFoundException, ConflictException, BusinessRuleException } from '../../../domain/exceptions/domain-exceptions';
import { UpdateUserDto, UserResponseDto } from '../../dto/user.dto';
import { prisma } from '../../../infrastructure/config/database';
import { ROLE_NAMES } from '../../../domain/constants/role-names';

export class UpdateUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private roleRepository: IRoleRepository,
    private userRoleRepository: IUserRoleRepository,
    private adminLimitService: AdminLimitService,
    private passwordDomainService: IPasswordDomainService
  ) {}

  async execute(userId: string, dto: UpdateUserDto, tenantId?: string | null): Promise<UserResponseDto> {
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

    // Check email uniqueness if updating email
    if (dto.email && dto.email !== user.email.getValue()) {
      const existingUser = await this.userRepository.findByEmail(dto.email, effectiveTenantId);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Validate roles if updating
    if (dto.roleIds && effectiveTenantId) {
      for (const roleId of dto.roleIds) {
        const role = await this.roleRepository.findById(roleId, effectiveTenantId);
        if (!role) {
          throw new NotFoundException('Role', roleId);
        }

        // Check admin limit if assigning admin role
        if (role.name === ROLE_NAMES.ADMIN) {
          const currentUserWithRoles = await this.userRoleRepository.getUserWithRoles(userId);
          const isCurrentlyAdmin = currentUserWithRoles?.roles.some((r) => r.name === ROLE_NAMES.ADMIN) || false;
          
          if (!isCurrentlyAdmin) {
            await this.adminLimitService.validateAdminLimit(effectiveTenantId, this.userRepository);
          }
        }
      }
    }

    // Hash password if provided (outside transaction as it's not a DB operation)
    const hashedPassword = dto.password
      ? await this.passwordDomainService.hashPassword(dto.password)
      : null;

    // Wrap all database operations in a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Update user
      await tx.user.update({
        where: { id: userId },
        data: {
          ...(dto.email && { email: dto.email }),
          ...(hashedPassword && { password: hashedPassword }),
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        },
      });

      // Update roles if provided
      if (dto.roleIds) {
        // Remove all existing roles
        await tx.userRole.deleteMany({
          where: { userId },
        });

        // Assign new roles
        if (dto.roleIds.length > 0) {
          await tx.userRole.createMany({
            data: dto.roleIds.map((roleId) => ({
              userId,
              roleId,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    // Return updated user (read operation, outside transaction)
    const userWithRoles = await this.userRoleRepository.getUserWithRoles(userId);

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

