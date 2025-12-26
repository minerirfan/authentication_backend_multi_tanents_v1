import { getCacheInstance } from './redis-cache.repository';
import { RoleRepository } from '../persistence/role.repository';
import { PermissionRepository } from '../persistence/permission.repository';

/**
 * Service for warming up caches on application startup
 */
export class CacheWarmingService {
  private roleRepository: RoleRepository;
  private permissionRepository: PermissionRepository;
  private cache = getCacheInstance();

  constructor() {
    this.roleRepository = new RoleRepository(this.cache);
    this.permissionRepository = new PermissionRepository(this.cache);
  }

  /**
   * Warm up all caches for a specific tenant
   */
  async warmTenantCache(tenantId: string): Promise<void> {
    console.log(`[CacheWarming] Starting cache warm-up for tenant ${tenantId}...`);

    const startTime = Date.now();

    try {
      // Warm up roles cache
      await this.roleRepository.warmCache(tenantId);

      // Warm up permissions cache
      await this.permissionRepository.warmCache(tenantId);

      const duration = Date.now() - startTime;
      console.log(`[CacheWarming] Cache warm-up completed for tenant ${tenantId} in ${duration}ms`);
    } catch (error) {
      console.error(`[CacheWarming] Error warming cache for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Warm up caches for multiple tenants
   */
  async warmMultipleTenants(tenantIds: string[]): Promise<void> {
    console.log(`[CacheWarming] Starting cache warm-up for ${tenantIds.length} tenants...`);

    const startTime = Date.now();

    try {
      await Promise.all(
        tenantIds.map(tenantId => this.warmTenantCache(tenantId))
      );

      const duration = Date.now() - startTime;
      console.log(`[CacheWarming] Cache warm-up completed for ${tenantIds.length} tenants in ${duration}ms`);
    } catch (error) {
      console.error('[CacheWarming] Error warming caches for multiple tenants:', error);
      throw error;
    }
  }

  /**
   * Warm up all caches for all tenants
   * Note: This should be used with caution as it can be resource-intensive
   */
  async warmAllCaches(): Promise<void> {
    console.log('[CacheWarming] Starting full cache warm-up...');

    const startTime = Date.now();

    try {
      // Get all tenants from database
      const { prisma } = await import('../config/database');
      const tenants = await prisma.tenant.findMany({
        select: { id: true },
      });

      console.log(`[CacheWarming] Found ${tenants.length} tenants to warm up`);

      // Warm up each tenant's cache
      await Promise.all(
        tenants.map(tenant => this.warmTenantCache(tenant.id))
      );

      const duration = Date.now() - startTime;
      console.log(`[CacheWarming] Full cache warm-up completed in ${duration}ms`);
    } catch (error) {
      console.error('[CacheWarming] Error warming all caches:', error);
      throw error;
    }
  }

  /**
   * Warm up caches for a specific set of data
   */
  async warmSpecificData(options: {
    tenantId?: string;
    roles?: string[];
    permissions?: string[];
  }): Promise<void> {
    console.log('[CacheWarming] Starting selective cache warm-up...');

    const startTime = Date.now();

    try {
      if (options.tenantId) {
        if (options.roles) {
          // Warm up specific roles
          const roles = await this.roleRepository.findByIds(options.roles, options.tenantId);
          console.log(`[CacheWarming] Warmed up ${roles.length} roles`);
        }

        if (options.permissions) {
          // Warm up specific permissions
          const permissions = await this.permissionRepository.findByIds(options.permissions);
          console.log(`[CacheWarming] Warmed up ${permissions.length} permissions`);
        }

        // If no specific data requested, warm up entire tenant
        if (!options.roles && !options.permissions) {
          await this.warmTenantCache(options.tenantId);
        }
      } else {
        console.log('[CacheWarming] No tenantId provided, skipping warm-up');
      }

      const duration = Date.now() - startTime;
      console.log(`[CacheWarming] Selective cache warm-up completed in ${duration}ms`);
    } catch (error) {
      console.error('[CacheWarming] Error warming specific caches:', error);
      throw error;
    }
  }

  /**
   * Get cache warming status
   */
  getStatus(): {
    cacheConnected: boolean;
    lastWarmUp?: Date;
  } {
    return {
      cacheConnected: true, // This is a placeholder; implement actual status tracking
    };
  }
}

// Singleton instance
let cacheWarmingServiceInstance: CacheWarmingService | null = null;

export function getCacheWarmingService(): CacheWarmingService {
  if (!cacheWarmingServiceInstance) {
    cacheWarmingServiceInstance = new CacheWarmingService();
  }
  return cacheWarmingServiceInstance;
}

export function resetCacheWarmingService(): void {
  cacheWarmingServiceInstance = null;
}
