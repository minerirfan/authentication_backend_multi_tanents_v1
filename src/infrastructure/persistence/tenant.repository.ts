import { ITenantRepository } from '../../domain/repositories/itenant-repository';
import { TenantEntity } from '../../domain/entities/tenant.entity';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';
import { prisma } from '../config/database';

export class TenantRepository implements ITenantRepository {
  async findById(id: string): Promise<TenantEntity | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
    });

    if (!tenant) return null;

    return this.toEntity(tenant);
  }

  async findBySlug(slug: string): Promise<TenantEntity | null> {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (!tenant) return null;

    return this.toEntity(tenant);
  }

  async findAll(pagination?: PaginationParams): Promise<PaginatedResult<TenantEntity>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.tenant.count(),
    ]);

    return {
      data: tenants.map((tenant) => this.toEntity(tenant)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(tenant: TenantEntity): Promise<TenantEntity> {
    const created = await prisma.tenant.create({
      data: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    });

    return this.toEntity(created);
  }

  async update(tenant: TenantEntity): Promise<TenantEntity> {
    const updated = await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        name: tenant.name,
        slug: tenant.slug,
      },
    });

    return this.toEntity(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.tenant.delete({
      where: { id },
    });
  }

  private toEntity(tenant: any): TenantEntity {
    return new TenantEntity(
      tenant.id,
      tenant.name,
      tenant.slug,
      tenant.createdAt,
      tenant.updatedAt
    );
  }
}

