import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { IRoleRepository } from '../../../domain/repositories/irole-repository';
import { IUserRoleRepository } from '../../../domain/repositories/iuser-role-repository';
import { AdminLimitService } from '../../../domain/services/admin-limit.service';
import { IPasswordDomainService } from '../../../domain/services/ipassword-domain.service';
import { UserEntity } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email';
import { Password } from '../../../domain/value-objects/password';
import { ConflictException, NotFoundException, BadRequestException, BusinessRuleException } from '../../../domain/exceptions/domain-exceptions';
import { CreateUserDto, UserResponseDto } from '../../dto/user.dto';
import { prisma } from '../../../infrastructure/config/database';
import { eventBus } from '../../../infrastructure/events/event-bus';
import { UserCreatedEvent } from '../../../domain/events/user-created.event';
import { ROLE_NAMES } from '../../../domain/constants/role-names';
import { v4 as uuidv4 } from 'uuid';

/**
 * Use case for creating a new user
 * 
 * Business Rules:
 * - Tenant ID is required
 * - Email must be unique within tenant
 * - Roles must exist and belong to tenant
 * - Maximum 2 admins allowed per tenant
 * - All operations are wrapped in a transaction for atomicity
 * 
 * @throws BadRequestException if tenant ID not provided
 * @throws ConflictException if user with email already exists
 * @throws NotFoundException if role not found
 * @throws BusinessRuleException if admin limit exceeded
 */
export class CreateUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private roleRepository: IRoleRepository,
    private userRoleRepository: IUserRoleRepository,
    private adminLimitService: AdminLimitService,
    private passwordDomainService: IPasswordDomainService
  ) {}

  async execute(dto: CreateUserDto, tenantId: string | undefined): Promise<UserResponseDto> {
    if (!tenantId) {
      throw new BadRequestException('Tenant ID is required for creating users');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: dto.email,
        tenantId,
      },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password (outside transaction as it's not a DB operation)
    const hashedPassword = await this.passwordDomainService.hashPassword(dto.password);

    // Wrap all database operations in a transaction to ensure atomicity
    let userId: string;
    await prisma.$transaction(async (tx) => {
      // Check admin limit if assigning admin role
      for (const roleId of dto.roleIds) {
        const role = await tx.role.findFirst({
          where: { id: roleId, tenantId },
        });
        
        if (!role) {
          throw new NotFoundException('Role', roleId);
        }

        if (role.name === ROLE_NAMES.ADMIN) {
          const adminCount = await tx.userRole.count({
            where: {
              role: {
                name: ROLE_NAMES.ADMIN,
                tenantId,
              },
            },
          });

          if (adminCount >= 2) {
            throw new BusinessRuleException('Maximum 2 admins allowed per tenant');
          }
        }
      }

      // Create user
      userId = uuidv4();
      await tx.user.create({
        data: {
          id: userId,
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          tenantId,
          isSuperAdmin: false,
        },
      });

      // Assign roles
      if (dto.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: dto.roleIds.map((roleId) => ({
            userId,
            roleId,
          })),
          skipDuplicates: true,
        });
      }
    });

    // Emit domain event (outside transaction)
    await eventBus.publish(new UserCreatedEvent(userId!, dto.email, tenantId, false));

    // Return user with roles (read operation, outside transaction)
    const userWithRoles = await this.userRoleRepository.getUserWithRoles(userId!);

    if (!userWithRoles) {
      throw new NotFoundException('User', userId!);
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
      })),
      createdAt: userWithRoles.createdAt,
      updatedAt: userWithRoles.updatedAt,
    };
  }
}

