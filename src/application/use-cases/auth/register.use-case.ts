import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { ITenantRepository } from '../../../domain/repositories/itenant-repository';
import { IRoleRepository } from '../../../domain/repositories/irole-repository';
import { IUserRoleRepository } from '../../../domain/repositories/iuser-role-repository';
import { ISystemConfigRepository } from '../../../domain/repositories/isystem-config-repository';
import { AdminLimitService } from '../../../domain/services/admin-limit.service';
import { IPasswordDomainService } from '../../../domain/services/ipassword-domain.service';
import { TenantSetupService } from '../../../domain/services/tenant-setup.service';
import { UserEntity } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email';
import { Password } from '../../../domain/value-objects/password';
import { ConflictException, NotFoundException, BusinessRuleException } from '../../../domain/exceptions/domain-exceptions';
import { IPermissionRepository } from '../../../domain/repositories/ipermission-repository';
import { RegisterDto } from '../../dto/auth.dto';
import { prisma } from '../../../infrastructure/config/database';
import { eventBus } from '../../../infrastructure/events/event-bus';
import { TenantCreatedEvent } from '../../../domain/events/tenant-created.event';
import { UserCreatedEvent } from '../../../domain/events/user-created.event';
import { ROLE_NAMES } from '../../../domain/constants/role-names';
import { DEFAULT_PERMISSIONS } from '../../../domain/constants/permission-names';
import { v4 as uuidv4 } from 'uuid';

/**
 * Use case for registering a new tenant with an admin user
 * 
 * Business Rules:
 * - System must be initialized (onboarded) before registration
 * - Tenant slug must be unique
 * - Maximum 2 admins allowed per tenant
 * - All operations are wrapped in a transaction for atomicity
 * 
 * @throws BusinessRuleException if system not initialized
 * @throws ConflictException if tenant slug already exists
 * @throws BusinessRuleException if admin limit exceeded
 */
export class RegisterUseCase {
  constructor(
    private userRepository: IUserRepository,
    private tenantRepository: ITenantRepository,
    private roleRepository: IRoleRepository,
    private userRoleRepository: IUserRoleRepository,
    private permissionRepository: IPermissionRepository,
    private systemConfigRepository: ISystemConfigRepository,
    private adminLimitService: AdminLimitService,
    private passwordDomainService: IPasswordDomainService,
    private tenantSetupService: TenantSetupService
  ) { }

  async execute(dto: RegisterDto): Promise<void> {
    // Check if system is initialized (only super admin can create tenants after onboarding)
    const systemConfig = await this.systemConfigRepository.findFirst();
    if (!systemConfig || !systemConfig.isInitialized) {
      throw new BusinessRuleException('System not initialized. Please use onboarding endpoint first.');
    }

    // Check if tenant slug already exists
    const existingTenant = await this.tenantRepository.findBySlug(dto.tenantSlug);
    if (existingTenant) {
      throw new ConflictException('Tenant slug already exists');
    }

    // Wrap all database operations in a transaction to ensure atomicity
    let tenantId!: string;
    let userId!: string;
    await prisma.$transaction(async (tx) => {
      tenantId = uuidv4();

      // Create tenant
      const createdTenant = await tx.tenant.create({
        data: {
          id: tenantId,
          name: dto.tenantName,
          slug: dto.tenantSlug,
        },
      });

      // Create default permissions for this tenant
      const defaultPermissions = await this.tenantSetupService.createDefaultPermissionsForTenant(tenantId, tx);

      // Find or create admin role
      let adminRole = await tx.role.findFirst({
        where: { name: ROLE_NAMES.ADMIN, tenantId },
      });

      if (!adminRole) {
        const roleId = uuidv4();
        adminRole = await tx.role.create({
          data: {
            id: roleId,
            name: ROLE_NAMES.ADMIN,
            description: 'Administrator role',
            tenantId,
          },
        });

        // Create role-permission associations
        if (defaultPermissions.length > 0) {
          await tx.rolePermission.createMany({
            data: defaultPermissions.map((p) => ({
              roleId: adminRole!.id,
              permissionId: p.id,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Hash password (outside transaction as it's not a DB operation)
      const hashedPassword = await this.passwordDomainService.hashPassword(dto.password);

      // Check admin count (read operation, can be outside transaction but checking inside for consistency)
      const adminRoleCount = await tx.userRole.count({
        where: {
          role: {
            name: ROLE_NAMES.ADMIN,
            tenantId,
          },
        },
      });

      if (adminRoleCount >= 2) {
        throw new BusinessRuleException('Maximum 2 admins allowed per tenant');
      }

      // Create user
      userId = uuidv4();
      const createdUser = await tx.user.create({
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

      // Assign admin role
      await tx.userRole.createMany({
        data: [{
          userId: createdUser.id,
          roleId: adminRole!.id,
        }],
        skipDuplicates: true,
      });
    });

    // Emit domain events (outside transaction)
    await eventBus.publish(new TenantCreatedEvent(tenantId, dto.tenantName, dto.tenantSlug));
    await eventBus.publish(new UserCreatedEvent(userId, dto.email, tenantId, false));
  }
}

