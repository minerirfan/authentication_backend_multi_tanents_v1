import { IPermissionRepository } from '../../domain/repositories/ipermission-repository';
import { PermissionEntity } from '../../domain/entities/permission.entity';
import { prisma } from '../config/database';

export class PermissionRepository implements IPermissionRepository {
  async findById(id: string, tenantId?: string): Promise<PermissionEntity | null> {
    const permission = await prisma.permission.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    if (!permission) return null;

    return this.toEntity(permission);
  }

  async findByName(name: string, tenantId: string): Promise<PermissionEntity | null> {
    const permission = await prisma.permission.findUnique({
      where: {
        name_tenantId: {
          name,
          tenantId,
        },
      },
    });

    if (!permission) return null;

    return this.toEntity(permission);
  }

  async findAll(tenantId?: string): Promise<PermissionEntity[]> {
    const permissions = await prisma.permission.findMany({
      where: tenantId ? { tenantId } : undefined,
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    return permissions.map((permission) => this.toEntity(permission));
  }

  async findByResource(resource: string, tenantId: string): Promise<PermissionEntity[]> {
    const permissions = await prisma.permission.findMany({
      where: {
        resource,
        tenantId,
      },
      orderBy: { action: 'asc' },
    });

    return permissions.map((permission) => this.toEntity(permission));
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

    return this.toEntity(created);
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

    return this.toEntity(updated);
  }

  async findByIds(ids: string[]): Promise<PermissionEntity[]> {
    const permissions = await prisma.permission.findMany({
      where: {
        id: { in: ids },
      },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });

    return permissions.map((permission) => this.toEntity(permission));
  }

  async delete(id: string): Promise<void> {
    await prisma.permission.delete({
      where: { id },
    });
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

