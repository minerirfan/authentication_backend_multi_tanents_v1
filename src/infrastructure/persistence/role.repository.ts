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

  private getRoleWithPermissionsCacheKey(id: string, tenantId: string): string {
    return `role:permissions:${id}:${tenantId}`;
  }
  async findById(id: string, tenantId: string): Promise<RoleEntity | null> {
    const role = await prisma.role.findFirst({
      where: { id, tenantId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) return null;

    return this.toEntity(role);
  }

  async findByName(name: string, tenantId: string): Promise<RoleEntity | null> {
    const role = await prisma.role.findFirst({
      where: { name, tenantId },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    if (!role) return null;

    return this.toEntity(role);
  }

  async findAll(tenantId: string, pagination?: PaginationParams): Promise<PaginatedResult<RoleEntity>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 1000; // Default high limit for backward compatibility
    const skip = (page - 1) * limit;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

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

    return {
      data: roles.map((role) => this.toEntity(role)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

    return this.toEntity(created);
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

    return this.toEntity(updated);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.role.deleteMany({
      where: { id, tenantId },
    });
  }

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({
        roleId,
        permissionId,
      })),
      skipDuplicates: true,
    });
  }

  async removePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId: { in: permissionIds },
      },
    });
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

    // Cache the result
    if (this.cache) {
      await this.cache.set(cacheKey, result, this.ROLE_CACHE_TTL);
    }

    return result;
  }

  async findByIds(ids: string[], tenantId?: string): Promise<RoleWithPermissions[]> {
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

    return roles.map((role) => this.mapToRoleWithPermissions(role));
  }

  async getRolesWithPermissions(tenantId: string, pagination?: PaginationParams): Promise<PaginatedResult<RoleWithPermissions>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

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

    return {
      data: roles.map((role) => this.mapToRoleWithPermissions(role)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

