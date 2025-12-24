import { IUserRoleRepository } from '../../domain/repositories/iuser-role-repository';
import { UserWithRoles } from '../../shared/types/user-with-roles';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';
import { prisma } from '../config/database';

export class UserRoleRepository implements IUserRoleRepository {
  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    await prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId,
        roleId,
      })),
      skipDuplicates: true, // Skip if already exists
    });
  }

  async removeRoles(userId: string, roleIds: string[]): Promise<void> {
    await prisma.userRole.deleteMany({
      where: {
        userId,
        roleId: {
          in: roleIds,
        },
      },
    });
  }

  async removeAllRoles(userId: string): Promise<void> {
    await prisma.userRole.deleteMany({
      where: {
        userId,
      },
    });
  }

  async getUserWithRoles(userId: string): Promise<UserWithRoles | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return null;

    return this.mapToUserWithRoles(user);
  }

  async getUsersWithRoles(
    tenantId: string | null,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<UserWithRoles>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

    const whereClause = tenantId !== null ? { tenantId } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.user.count({
        where: whereClause,
      }),
    ]);

    return {
      data: users.map((user) => this.mapToUserWithRoles(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUsersByRole(roleId: string, tenantId: string): Promise<UserWithRoles[]> {
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        userRoles: {
          some: {
            roleId,
          },
        },
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return users.map((user) => this.mapToUserWithRoles(user));
  }

  private mapToUserWithRoles(user: any): UserWithRoles {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: user.tenantId,
      isSuperAdmin: user.isSuperAdmin || false,
      roles: user.userRoles.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description,
        permissions: ur.role.rolePermissions.map((rp: any) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

