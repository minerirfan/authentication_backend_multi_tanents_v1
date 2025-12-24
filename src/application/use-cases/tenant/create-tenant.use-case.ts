import { ITenantRepository } from '../../../domain/repositories/itenant-repository';
import { IRoleRepository } from '../../../domain/repositories/irole-repository';
import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { IUserRoleRepository } from '../../../domain/repositories/iuser-role-repository';
import { IPermissionRepository } from '../../../domain/repositories/ipermission-repository';
import { IPasswordDomainService } from '../../../domain/services/ipassword-domain.service';
import { TenantSetupService } from '../../../domain/services/tenant-setup.service';
import { TenantEntity } from '../../../domain/entities/tenant.entity';
import { UserEntity } from '../../../domain/entities/user.entity';
import { Email } from '../../../domain/value-objects/email';
import { Password } from '../../../domain/value-objects/password';
import { ConflictException } from '../../../domain/exceptions/domain-exceptions';
import { prisma } from '../../../infrastructure/config/database';
import { eventBus } from '../../../infrastructure/events/event-bus';
import { TenantCreatedEvent } from '../../../domain/events/tenant-created.event';
import { UserCreatedEvent } from '../../../domain/events/user-created.event';
import { ROLE_NAMES } from '../../../domain/constants/role-names';
import { DEFAULT_PERMISSIONS } from '../../../domain/constants/permission-names';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTenantDto {
  name: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
}

export class CreateTenantUseCase {
  constructor(
    private tenantRepository: ITenantRepository,
    private roleRepository: IRoleRepository,
    private userRepository: IUserRepository,
    private userRoleRepository: IUserRoleRepository,
    private permissionRepository: IPermissionRepository,
    private passwordDomainService: IPasswordDomainService,
    private tenantSetupService: TenantSetupService
  ) { }

  async execute(dto: CreateTenantDto): Promise<TenantEntity> {
    // Check if tenant slug already exists
    const existingTenant = await this.tenantRepository.findBySlug(dto.slug);
    if (existingTenant) {
      throw new ConflictException('Tenant slug already exists');
    }

    // Hash password (outside transaction as it's not a DB operation)
    const hashedPassword = await this.passwordDomainService.hashPassword(dto.adminPassword);

    // Wrap all database operations in a transaction to ensure atomicity
    let tenantId!: string;
    let userId!: string;
    await prisma.$transaction(async (tx) => {
      // Create tenant
      tenantId = uuidv4();
      const createdTenant = await tx.tenant.create({
        data: {
          id: tenantId,
          name: dto.name,
          slug: dto.slug,
        },
      });

      // Create default permissions for this tenant
      const defaultPermissions = await this.tenantSetupService.createDefaultPermissionsForTenant(tenantId, tx);

      // Find or create admin role for this tenant
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

      // Create tenant admin user
      userId = uuidv4();
      await tx.user.create({
        data: {
          id: userId,
          email: dto.adminEmail,
          password: hashedPassword,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          tenantId,
          isSuperAdmin: false,
        },
      });

      // Assign admin role
      await tx.userRole.createMany({
        data: [{
          userId,
          roleId: adminRole.id,
        }],
        skipDuplicates: true,
      });
    });

    // Emit domain events (outside transaction)
    await eventBus.publish(new TenantCreatedEvent(tenantId, dto.name, dto.slug));
    await eventBus.publish(new UserCreatedEvent(userId, dto.adminEmail, tenantId, false));

    // Return tenant entity (read operation, outside transaction)
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new Error('Failed to retrieve created tenant');
    }
    return tenant;
  }
}

