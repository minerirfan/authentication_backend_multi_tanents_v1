import { IPermissionRepository } from '../repositories/ipermission-repository';
import { PermissionEntity } from '../entities/permission.entity';
import { DEFAULT_PERMISSIONS } from '../constants/permission-names';
import { v4 as uuidv4 } from 'uuid';

/**
 * Domain service for tenant setup operations
 * Encapsulates business logic for setting up new tenants
 */
export class TenantSetupService {
  constructor(private permissionRepository: IPermissionRepository) {}

  /**
   * Create default permissions for a tenant
   * @param tenantId - The tenant ID to create permissions for
   * @param tx - Optional Prisma transaction client
   * @returns Array of created permission entities
   */
  async createDefaultPermissionsForTenant(
    tenantId: string,
    tx?: any
  ): Promise<PermissionEntity[]> {
    const createdPermissions: PermissionEntity[] = [];

    for (const perm of DEFAULT_PERMISSIONS) {
      // Check if permission already exists for this tenant
      const existing = tx
        ? await tx.permission.findFirst({
            where: { name: perm.name, tenantId },
          })
        : await this.permissionRepository.findByName(perm.name, tenantId);

      if (!existing) {
        const permissionId = uuidv4();
        const permissionEntity = new PermissionEntity(
          permissionId,
          perm.name,
          perm.resource,
          perm.action,
          perm.description,
          tenantId
        );

        if (tx) {
          const created = await tx.permission.create({
            data: {
              id: permissionId,
              name: perm.name,
              resource: perm.resource,
              action: perm.action,
              description: perm.description,
              tenantId,
            },
          });

          const createdEntity = new PermissionEntity(
            created.id,
            created.name,
            created.resource,
            created.action,
            created.description,
            created.tenantId
          );
          createdPermissions.push(createdEntity);
        } else {
          const permission = await this.permissionRepository.create(permissionEntity);
          createdPermissions.push(permission);
        }
      } else {
        const permissionEntity = new PermissionEntity(
          existing.id,
          existing.name,
          existing.resource,
          existing.action,
          existing.description,
          existing.tenantId
        );
        createdPermissions.push(permissionEntity);
      }
    }

    return createdPermissions;
  }
}

