import { IRoleRepository } from '../../domain/repositories/irole-repository';
import { ICacheRepository } from '../../domain/repositories/icache-repository';
import { RoleEntity } from '../../domain/entities/role.entity';
import { RoleWithPermissions } from '../../shared/types/role-with-permissions';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';
import { prisma } from '../config/database';

export class RoleRepository implements IRoleRepository {
  private readonly ROLE_CACHE_TTL = parseInt(process.env.REDIS_TTL_ROLE || '600', 10); // 10 minutes default

  constructor(private cache?: ICacheRepository) { }

  private getCacheKey(id: string, tenantId: string): string {
    return `role:${id}:${tenantId}`;
  }

  private getRoleByNameCacheKey(name: string, tenantId: string): string {
    return `role:name:${name}:${tenantId}`;
  }

  private getRolesByTenantCacheKey(tenantId: string, page: number, limit: number): string {
    return `roles:tenant:${tenantId}:${page}:${limit}`;
  }

  private getRoleWithPermissionsCacheKey(id: string, tenantId: string): string {
    return `role:permissions:${id}:${tenantId}`;
  }

  private getRolesWithPermissionsCacheKey(tenantId: string, page: number, limit: number): string {
    return `roles:permissions:tenant:${tenantId}:${page}:${limit}`;
  }

  private getRolesByIdsCacheKey(ids: string[]): string {
    return `roles:ids:${ids.sort().join(',')}`;
  }

  async findById(id: string, tenantId: string): Promise<RoleEntity | null> {
    const cacheKey = this.getCacheKey(id, tenantId);

    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<RoleEntity>(cacheKey);
      if (cached) return cached;
    }

    const role = await prisma.role.findFirst({
      where: { id, tenantId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) return null;

    const entity = this.toEntity(role);

    // Cache result
    if (this.cache) {
      await this.cache.set(cacheKey, entity, this.ROLE_CACHE_TTL);
    }

    return entity;
  }

  async findByName(name: string, tenantId: string): Promise<RoleEntity | null> {
    const cacheKey = this.getRoleByNameCacheKey(name, tenantId);

    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<RoleEntity>(cacheKey);
      if (cached) return cached;
    }

    const role = await prisma.role.findFirst({
      where: { name, tenantId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) return null;

    const entity = this.toEntity(role);

    // Cache result
    if (this.cache) {
      await this.cache.set(cacheKey, entity, this.ROLE_CACHE_TTL);
    }

    return entity;
  }

  async findAll(tenantId: string, pagination?: PaginationParams): Promise<PaginatedResult<RoleEntity>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 1000; // Default high limit for backward compatibility
    const skip = (page - 1) * limit;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

    const cacheKey = this.getRolesByTenantCacheKey(tenantId, page, limit);

    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<PaginatedResult<RoleEntity>>(cacheKey);
      if (cached) return cached;
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.role.count({
        where: { tenantId },
      }),
    ]);

    const result = {
      data: roles.map((role) => this.toEntity(role)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Cache result
    if (this.cache) {
      await this.cache.set(cacheKey, result, this.ROLE_CACHE_TTL);
    }

    return result;
  }

  async create(role: RoleEntity): Promise<RoleEntity> {
    const created = await prisma.role.create({
      data: {
        id: role.id,
        name: role.name,
        description: role.description,
        tenantId: role.tenantId,
        rolePermissions: {
          create: role.permissionIds.map((permissionId) => ({
            permissionId,
          })),
        },
      },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    const entity = this.toEntity(created);

    // Invalidate relevant caches
    await this.invalidateCaches(entity);

    return entity;
  }

  async update(role: RoleEntity): Promise<RoleEntity> {
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    const updated = await prisma.role.update({
      where: { id: role.id },
      data: {
        name: role.name,
        description: role.description,
        rolePermissions: {
          create: role.permissionIds.map((permissionId) => ({
            permissionId,
          })),
        },
      },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    const entity = this.toEntity(updated);

    // Invalidate relevant caches
    await this.invalidateCaches(entity);

    return entity;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.role.deleteMany({
      where: { id, tenantId },
    });

    // Invalidate caches for this role
    await this.invalidateRoleCaches(id, tenantId);
  }

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
      skipDuplicates: true,
    });

    // Invalidate role caches
    // Note: We need tenantId to properly invalidate, but it's not available here
    // In a real implementation, you might want to fetch the role first or use a different cache strategy
  }

  async removePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: { in: permissionIds },
      },
    });

    // Invalidate role caches
    // Note: Same issue as assignPermissions
  }

  async getRoleWithPermissions(id: string, tenantId: string): Promise<RoleWithPermissions | null> {
    const cacheKey = this.getRoleWithPermissionsCacheKey(id, tenantId);

    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<RoleWithPermissions>(cacheKey);
      if (cached) return cached;
    }

    const role = await prisma.role.findFirst({
      where: { id, tenantId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) return null;

    const result = this.mapToRoleWithPermissions(role);

    // Cache result
    if (this.cache) {
      await this.cache.set(cacheKey, result, this.ROLE_CACHE_TTL);
    }

    return result;
  }

  async findByIds(ids: string[], tenantId?: string): Promise<RoleWithPermissions[]> {
    const cacheKey = this.getRolesByIdsCacheKey(ids);

    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<RoleWithPermissions[]>(cacheKey);
      if (cached) return cached;
    }

    const roles = await prisma.role.findMany({
      where: {
        id: { in: ids },
        ...(tenantId && { tenantId }),
      },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    const result = roles.map((role) => this.mapToRoleWithPermissions(role));

    // Cache result
    if (this.cache) {
      await this.cache.set(cacheKey, result, this.ROLE_CACHE_TTL);
    }

    return result;
  }

  async getRolesWithPermissions(tenantId: string, pagination?: PaginationParams): Promise<PaginatedResult<RoleWithPermissions>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

    const cacheKey = this.getRolesWithPermissionsCacheKey(tenantId, page, limit);

    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<PaginatedResult<RoleWithPermissions>>(cacheKey);
      if (cached) return cached;
    }

    const [roles, total] = await Promise.all([
      prisma.role.findMany({
        where: { tenantId },
        skip,
        take: limit,
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.role.count({
        where: { tenantId },
      }),
    ]);

    const result = {
      data: roles.map((role) => this.mapToRoleWithPermissions(role)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Cache result
    if (this.cache) {
      await this.cache.set(cacheKey, result, this.ROLE_CACHE_TTL);
    }

    return result;
  }

  /**
   * Invalidate all relevant caches for a role
   */
  private async invalidateCaches(role: RoleEntity): Promise<void> {
    if (!this.cache) return;

    const keysToDelete = [
      this.getCacheKey(role.id, role.tenantId),
      this.getRoleByNameCacheKey(role.name, role.tenantId),
      this.getRoleWithPermissionsCacheKey(role.id, role.tenantId),
    ];

    // Invalidate all pagination caches for this tenant
    // In production, you might want to use a more sophisticated approach
    // like using Redis SCAN or maintaining a set of cache keys per tenant
    for (let page = 1; page <= 100; page++) { // Reasonable limit
      keysToDelete.push(this.getRolesByTenantCacheKey(role.tenantId, page, 10));
      keysToDelete.push(this.getRolesByTenantCacheKey(role.tenantId, page, 20));
      keysToDelete.push(this.getRolesByTenantCacheKey(role.tenantId, page, 50));
      keysToDelete.push(this.getRolesWithPermissionsCacheKey(role.tenantId, page, 10));
      keysToDelete.push(this.getRolesWithPermissionsCacheKey(role.tenantId, page, 20));
    }

    await Promise.all(keysToDelete.map(key => this.cache!.delete(key)));
  }

  /**
   * Invalidate caches for a specific role
   */
  private async invalidateRoleCaches(roleId: string, tenantId: string): Promise<void> {
    if (!this.cache) return;

    // We need to fetch the role to get its name for cache invalidation
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) return;

    const keysToDelete = [
      this.getCacheKey(roleId, tenantId),
      this.getRoleByNameCacheKey(role.name, tenantId),
      this.getRoleWithPermissionsCacheKey(roleId, tenantId),
    ];

    await Promise.all(keysToDelete.map(key => this.cache!.delete(key)));
  }

  /**
   * Clear all role caches (useful for testing or manual cache clearing)
   */
  async clearCache(): Promise<void> {
    if (!this.cache) return;

    // Note: This is a simple implementation. In production, you might want
    // to use Redis SCAN to find all role-related keys.
    await this.cache.clear();
  }

  /**
   * Warm up cache with all roles for a tenant
   */
  async warmCache(tenantId: string): Promise<void> {
    if (!this.cache) return;

    const roles = await prisma.role.findMany({
      where: { tenantId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    // Cache individual roles
    await Promise.all(
      roles.map((role) => {
        const entity = this.toEntity(role);
        return this.cache!.set(this.getCacheKey(role.id, tenantId), entity, this.ROLE_CACHE_TTL);
      })
    );

    // Cache by name
    await Promise.all(
      roles.map((role) => {
        const entity = this.toEntity(role);
        return this.cache!.set(
          this.getRoleByNameCacheKey(role.name, tenantId),
          entity,
          this.ROLE_CACHE_TTL
        );
      })
    );

    // Cache roles with permissions
    await Promise.all(
      roles.map((role) => {
        const result = this.mapToRoleWithPermissions(role);
        return this.cache!.set(
          this.getRoleWithPermissionsCacheKey(role.id, tenantId),
          result,
          this.ROLE_CACHE_TTL
        );
      })
    );

    console.log(`Warmed cache for ${roles.length} roles in tenant ${tenantId}`);
  }

  private toEntity(role: any): RoleEntity {
    return new RoleEntity(
      role.id,
      role.name,
      role.description,
      role.tenantId,
      role.createdAt,
      role.updatedAt,
      role.rolePermissions?.map((rp: any) => rp.permissionId) || []
    );
  }

  private mapToRoleWithPermissions(role: any): RoleWithPermissions {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      tenantId: role.tenantId,
      permissions: role.rolePermissions.map((rp: any) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}
