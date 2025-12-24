import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { ITenantRepository } from '../../../domain/repositories/itenant-repository';
import { IRoleRepository } from '../../../domain/repositories/irole-repository';
import { IPermissionRepository } from '../../../domain/repositories/ipermission-repository';
import { ISystemConfigRepository } from '../../../domain/repositories/isystem-config-repository';
import { IPasswordDomainService } from '../../../domain/services/ipassword-domain.service';
import { UserEntity } from '../../../domain/entities/user.entity';
import { TenantEntity } from '../../../domain/entities/tenant.entity';
import { RoleEntity } from '../../../domain/entities/role.entity';
import { Email } from '../../../domain/value-objects/email';
import { Password } from '../../../domain/value-objects/password';
import { ConflictException, NotFoundException, BusinessRuleException } from '../../../domain/exceptions/domain-exceptions';
import { OnboardDto } from '../../dto/auth.dto';
import { prisma } from '../../../infrastructure/config/database';
import { eventBus } from '../../../infrastructure/events/event-bus';
import { UserCreatedEvent } from '../../../domain/events/user-created.event';
import { v4 as uuidv4 } from 'uuid';

/**
 * Use case for initial system onboarding
 * 
 * Business Rules:
 * - Can only be executed once (system initialization check)
 * - Creates the first super admin user
 * - Marks system as initialized
 * - All operations are wrapped in a transaction for atomicity
 * 
 * @throws BusinessRuleException if system already initialized
 * @throws ConflictException if user with email already exists
 */
export class OnboardUseCase {
  constructor(
    private userRepository: IUserRepository,
    private tenantRepository: ITenantRepository,
    private roleRepository: IRoleRepository,
    private permissionRepository: IPermissionRepository,
    private systemConfigRepository: ISystemConfigRepository,
    private passwordDomainService: IPasswordDomainService
  ) { }

  async execute(dto: OnboardDto): Promise<void> {
    // Check if system is already initialized
    let systemConfig = await this.systemConfigRepository.findFirst();
    if (!systemConfig) {
      systemConfig = await this.systemConfigRepository.create({
        id: uuidv4(),
        isInitialized: false,
        initializedAt: null,
      });
    }

    if (systemConfig.isInitialized) {
      throw new BusinessRuleException('System has already been initialized. Onboarding is no longer available.');
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password (outside transaction as it's not a DB operation)
    const hashedPassword = await this.passwordDomainService.hashPassword(dto.password);

    // Wrap all database operations in a transaction to ensure atomicity
    let userId!: string;
    await prisma.$transaction(async (tx) => {
      // Create super admin user (no tenantId, isSuperAdmin = true)
      userId = uuidv4();
      await tx.user.create({
        data: {
          id: userId,
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          tenantId: null, // No tenant for super admin
          isSuperAdmin: true,
        },
      });

      // Mark system as initialized
      await tx.systemConfig.update({
        where: { id: systemConfig.id },
        data: {
          isInitialized: true,
          initializedAt: new Date(),
        },
      });
    });

    // Emit domain event (outside transaction)
    await eventBus.publish(new UserCreatedEvent(userId, dto.email, null, true));
  }


}

