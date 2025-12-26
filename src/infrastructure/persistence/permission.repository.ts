import { IPermissionRepository } from '../../domain/repositories/ipermission-repository';
import { ICacheRepository } from '../../domain/repositories/icache-repository';
import { PermissionEntity } from '../../domain/entities/permission.entity';
import { prisma } from '../config/database';

export class PermissionRepository implements IPermissionRepository {
  private readonly PERMISSION_CACHE_TTL = parseInt(process.env.REDIS_TTL_PERMISSION || '600', 10); // 10 minutes default

  constructor(private cache?: ICacheRepository) { }

  private getCacheKey(id: string, tenantId?: string): string {
    return tenantId ? `permission:${id}:${tenantId}` : `permission:${id}`;
  }

  private getPermissionsByTenantCacheKey(tenantId: string): string {
    return `permissions:tenant:${tenantId}`;
  }

  private getPermissionsByResourceCacheKey(resource: string, tenantId: string): string {
    return `permissions:resource:${resource}:${tenantId}`;
  }

  private getPermissionsAllCacheKey(): string {
    return 'permissions:all';
  }

  async findById(id: string, tenantId?: string): Promise<PermissionEntity | null> {
    const cacheKey = this.getCacheKey(id, tenantId);

    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<PermissionEntity>(cacheKey);
      if (cached) return cached;
    }

    const permission = await prisma.permission.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    if (!permission) return null;

    const entity = this.toEntity(permission);

    // Cache result
    if (this.cache) {
      await this.cache.set(cacheKey, entity, this.PERMISSION_CACHE_TTL);
    }

    return entity;
  }

  async findByName(name: string, tenantId: string): Promise<PermissionEntity | null> {
    const cacheKey = `permission:name:${name}:${tenantId}`;

    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<PermissionEntity>(cacheKey);
      if (cached) return cached;
    }

    const permission = await prisma.permission.findUnique({
      where: {
        name_tenantId: {
          name,
          tenantId,
        },
      },
    });

    if (!permission) return null;

    const entity = this.toEntity(permission);

    // Cache result
    if (this.cache) {
      await this.cache.set(cacheKey, entity, this.PERMISSION_CACHE_TTL);
    }

    return entity;
  }

  async findAll(tenantId?: string): Promise<PermissionEntity[]> {
    const cacheKey = tenantId ? this.getPermissionsByTenantCacheKey(tenantId) : this.getPermissionsAllCacheKey();

    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<PermissionEntity[]>(cacheKey);
      if (cached) return cached;
    }

    const permissions = await prisma.permission.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    const entities = permissions.map((permission) => this.toEntity(permission));

    // Cache result
    if (this.cache) {
      await this.cache.set(cacheKey, entities, this.PERMISSION_CACHE_TTL);
    }

    return entities;
  }

  async findByResource(resource: string, tenantId: string): Promise<PermissionEntity[]> {
    const cacheKey = this.getPermissionsByResourceCacheKey(resource, tenantId);

    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<PermissionEntity[]>(cacheKey);
      if (cached) return cached;
    }

    const permissions = await prisma.permission.findMany({
      where: {
        resource,
        tenantId,
      },
      orderBy: { action: 'asc' },
    });

    const entities = permissions.map((permission) => this.toEntity(permission));

    // Cache result
    if (this.cache) {
      await this.cache.set(cacheKey, entities, this.PERMISSION_CACHE_TTL);
    }

    return entities;
  }

  async create(permission: PermissionEntity): Promise<PermissionEntity> {
    const created = await prisma.permission.create({
      data: {
        id: permission.id,
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
        tenantId: permission.tenantId,
      },
    });

    const entity = this.toEntity(created);

    // Invalidate relevant caches
    await this.invalidateCaches(entity);

    return entity;
  }

  async update(permission: PermissionEntity): Promise<PermissionEntity> {
    const updated = await prisma.permission.update({
      where: { id: permission.id },
      data: {
        name: permission.name,
        resource: permission.resource,
        action: permission.action,
        description: permission.description,
      },
    });

    const entity = this.toEntity(updated);

    // Invalidate relevant caches
    await this.invalidateCaches(entity);

    return entity;
  }

  async findByIds(ids: string[]): Promise<PermissionEntity[]> {
    // Try to get from cache first
    const cachedPermissions: PermissionEntity[] = [];
    const uncachedIds: string[] = [];

    if (this.cache) {
      for (const id of ids) {
        const cached = await this.cache.get<PermissionEntity>(`permission:${id}`);
        if (cached) {
          cachedPermissions.push(cached);
        } else {
          uncachedIds.push(id);
        }
      }
    } else {
      uncachedIds.push(...ids);
    }

    // Fetch uncached permissions from database
    let dbPermissions: PermissionEntity[] = [];
    if (uncachedIds.length > 0) {
      const permissions = await prisma.permission.findMany({
        where: {
          id: { in: uncachedIds },
        },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
      });

      dbPermissions = permissions.map((permission) => this.toEntity(permission));

      // Cache newly fetched permissions
      if (this.cache) {
        for (const permission of dbPermissions) {
          await this.cache.set(`permission:${permission.id}`, permission, this.PERMISSION_CACHE_TTL);
        }
      }
    }

    // Combine cached and database results, maintaining order
    const permissionMap = new Map<string, PermissionEntity>();
    [...cachedPermissions, ...dbPermissions].forEach(p => permissionMap.set(p.id, p));

    return ids.map(id => permissionMap.get(id)).filter((p): p is PermissionEntity => p !== undefined);
  }

  async delete(id: string): Promise<void> {
    const permission = await prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) return;

    await prisma.permission.delete({
      where: { id },
    });

    // Invalidate relevant caches
    const entity = this.toEntity(permission);
    await this.invalidateCaches(entity);
  }

  /**
   * Invalidate all relevant caches for a permission
   */
  private async invalidateCaches(permission: PermissionEntity): Promise<void> {
    if (!this.cache) return;

    const keysToDelete = [
      this.getCacheKey(permission.id),
      `permission:name:${permission.name}:${permission.tenantId}`,
      this.getPermissionsByTenantCacheKey(permission.tenantId),
      this.getPermissionsByResourceCacheKey(permission.resource, permission.tenantId),
      this.getPermissionsAllCacheKey(),
    ];

    await Promise.all(keysToDelete.map(key => this.cache!.delete(key)));
  }

  /**
   * Clear all permission caches (useful for testing or manual cache clearing)
   */
  async clearCache(): Promise<void> {
    if (!this.cache) return;

    // Note: This is a simple implementation. In production, you might want
    // to use Redis SCAN to find all permission-related keys.
    await this.cache.clear();
  }

  /**
   * Warm up cache with all permissions for a tenant
   */
  async warmCache(tenantId: string): Promise<void> {
    if (!this.cache) return;

    const permissions = await prisma.permission.findMany({
      where: { tenantId },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    const entities = permissions.map((permission) => this.toEntity(permission));

    // Cache individual permissions
    await Promise.all(
      entities.map((entity) =>
        this.cache!.set(this.getCacheKey(entity.id, tenantId), entity, this.PERMISSION_CACHE_TTL)
      )
    );

    // Cache by name
    await Promise.all(
      entities.map((entity) =>
        this.cache!.set(
          `permission:name:${entity.name}:${tenantId}`,
          entity,
          this.PERMISSION_CACHE_TTL
        )
      )
    );

    // Cache all permissions for tenant
    await this.cache.set(
      this.getPermissionsByTenantCacheKey(tenantId),
      entities,
      this.PERMISSION_CACHE_TTL
    );

    // Cache by resource
    const resourceMap = new Map<string, PermissionEntity[]>();
    entities.forEach((entity) => {
      if (!resourceMap.has(entity.resource)) {
        resourceMap.set(entity.resource, []);
      }
      resourceMap.get(entity.resource)!.push(entity);
    });

    await Promise.all(
      Array.from(resourceMap.entries()).map(([resource, perms]) =>
        this.cache!.set(
          this.getPermissionsByResourceCacheKey(resource, tenantId),
          perms,
          this.PERMISSION_CACHE_TTL
        )
      )
    );

    console.log(`Warmed cache for ${entities.length} permissions in tenant ${tenantId}`);
  }

  private toEntity(permission: any): PermissionEntity {
    return new PermissionEntity(
      permission.id,
      permission.name,
      permission.resource,
      permission.action,
      permission.description,
      permission.tenantId
    );
  }
}
