import { IUserRepository } from '../../domain/repositories/iuser-repository';
import { ICacheRepository } from '../../domain/repositories/icache-repository';
import { UserEntity } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email';
import { Password } from '../../domain/value-objects/password';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';
import { prisma } from '../config/database';
import { NotFoundException } from '../../domain/exceptions/domain-exceptions';
import { UserCacheDto } from './dto/user-cache.dto';
import { ROLE_NAMES } from '../../domain/constants/role-names';

export class UserRepository implements IUserRepository {
  private readonly USER_CACHE_TTL = parseInt(process.env.REDIS_TTL_USER || '300', 10); // 5 minutes default

  constructor(private cache?: ICacheRepository) {}

  private getCacheKey(id: string, tenantId?: string | null): string {
    return tenantId ? `user:${id}:${tenantId}` : `user:${id}`;
  }

  private getEmailCacheKey(email: string, tenantId: string): string {
    return `user:email:${email}:${tenantId}`;
  }

  /**
   * Convert UserEntity to UserCacheDto for caching
   * SECURITY: Password is NOT cached to prevent exposure if Redis is compromised
   */
  private entityToDto(entity: UserEntity): UserCacheDto {
    return {
      id: entity.id,
      email: entity.email.getValue(),
      firstName: entity.firstName,
      lastName: entity.lastName,
      tenantId: entity.tenantId,
      isSuperAdmin: entity.isSuperAdmin,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Convert UserCacheDto to UserEntity
   * SECURITY: Password is fetched from database, not cache
   */
  private async dtoToEntity(dto: UserCacheDto): Promise<UserEntity> {
    // Fetch password from database (not cache) for security
    const user = await prisma.user.findUnique({
      where: { id: dto.id },
      select: { password: true },
    });

    if (!user) {
      throw new Error(`User ${dto.id} not found in database`);
    }

    return new UserEntity(
      dto.id,
      new Email(dto.email),
      new Password(user.password, true),
      dto.firstName,
      dto.lastName,
      dto.tenantId,
      dto.isSuperAdmin,
      dto.createdAt,
      dto.updatedAt
    );
  }

  async findById(id: string, tenantId?: string | null): Promise<UserEntity | null> {
    const cacheKey = this.getCacheKey(id, tenantId);
    
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<UserCacheDto>(cacheKey);
      if (cached) {
        return await this.dtoToEntity(cached);
      }
    }

    // If tenantId is provided, search with tenantId, otherwise search by id only (for super admin)
    const whereClause = tenantId !== undefined && tenantId !== null
      ? { id, tenantId }
      : { id };

    const user = await prisma.user.findFirst({
      where: whereClause,
    });

    if (!user) return null;

    const entity = this.toEntity(user);
    
    // Cache the result as DTO (without password)
    if (this.cache) {
      const dto = this.entityToDto(entity);
      await this.cache.set(cacheKey, dto, this.USER_CACHE_TTL);
    }

    return entity;
  }

  async findByEmail(email: string, tenantId: string | null): Promise<UserEntity | null> {
    const cacheKey = tenantId ? this.getEmailCacheKey(email, tenantId) : `user:email:${email}`;
    
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<UserCacheDto>(cacheKey);
      if (cached) {
        return await this.dtoToEntity(cached);
      }
    }

    // Build where clause - handle null tenantId for super admin
    const whereClause = tenantId !== null && tenantId !== undefined
      ? { email, tenantId }
      : { email, tenantId: null };

    const user = await prisma.user.findFirst({
      where: whereClause,
    });

    if (!user) return null;

    const entity = this.toEntity(user);
    
    // Cache the result as DTO (without password)
    if (this.cache) {
      const dto = this.entityToDto(entity);
      await this.cache.set(cacheKey, dto, this.USER_CACHE_TTL);
      // Also cache by ID
      await this.cache.set(this.getCacheKey(user.id, user.tenantId), dto, this.USER_CACHE_TTL);
    }

    return entity;
  }

  /**
   * Find minimal user data by email (no tenant filter)
   * Used for login to check if email exists across all tenants
   * Returns only ID, email, and tenantId (no password for security)
   */
  async findByEmailOnly(email: string): Promise<{ id: string; email: string; tenantId: string | null } | null> {
    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true, email: true, tenantId: true },
    });
    return user;
  }

  async findAll(tenantId: string, pagination?: PaginationParams): Promise<PaginatedResult<UserEntity>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = pagination?.sortBy || 'createdAt';
    const sortOrder = pagination?.sortOrder || 'desc';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId },
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.user.count({
        where: { tenantId },
      }),
    ]);

    return {
      data: users.map((user) => this.toEntity(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(user: UserEntity): Promise<UserEntity> {
    const created = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email.getValue(),
        password: user.getPassword().getValue(),
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId,
        isSuperAdmin: user.isSuperAdmin,
      },
    });

    const entity = this.toEntity(created);
    
    // Cache the new user as DTO
    if (this.cache) {
      const dto = this.entityToDto(entity);
      const cacheKey = this.getCacheKey(entity.id, entity.tenantId);
      const emailCacheKey = this.getEmailCacheKey(entity.email.getValue(), entity.tenantId || '');
      await this.cache.set(cacheKey, dto, this.USER_CACHE_TTL);
      await this.cache.set(emailCacheKey, dto, this.USER_CACHE_TTL);
    }

    return entity;
  }

  async update(user: UserEntity): Promise<UserEntity> {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.email.getValue(),
        password: user.getPassword().getValue(),
        firstName: user.firstName,
        lastName: user.lastName,
        isSuperAdmin: user.isSuperAdmin,
      },
    });

    const entity = this.toEntity(updated);
    
    // Update cache as DTO
    if (this.cache) {
      const dto = this.entityToDto(entity);
      const cacheKey = this.getCacheKey(entity.id, entity.tenantId);
      const emailCacheKey = this.getEmailCacheKey(entity.email.getValue(), entity.tenantId || '');
      await this.cache.set(cacheKey, dto, this.USER_CACHE_TTL);
      await this.cache.set(emailCacheKey, dto, this.USER_CACHE_TTL);
    }

    return entity;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    // Get user first to invalidate cache
    const user = await prisma.user.findFirst({
      where: { id, tenantId },
    });

    await prisma.user.deleteMany({
      where: { id, tenantId },
    });

    // Invalidate cache
    if (this.cache && user) {
      const cacheKey = this.getCacheKey(id, tenantId);
      const emailCacheKey = this.getEmailCacheKey(user.email, tenantId);
      await this.cache.delete(cacheKey);
      await this.cache.delete(emailCacheKey);
    }
  }

  async countAdmins(tenantId: string): Promise<number> {
    const adminRole = await prisma.role.findFirst({
      where: { name: ROLE_NAMES.ADMIN, tenantId },
      include: { userRoles: true },
    });

    if (!adminRole) return 0;

    return adminRole.userRoles.length;
  }

  async findUsersByRole(roleId: string, tenantId: string): Promise<UserEntity[]> {
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        userRoles: {
          some: { roleId },
        },
      },
    });

    return users.map((user) => this.toEntity(user));
  }

  private toEntity(user: any): UserEntity {
    return new UserEntity(
      user.id,
      new Email(user.email),
      new Password(user.password, true),
      user.firstName,
      user.lastName,
      user.tenantId,
      user.isSuperAdmin || false,
      user.createdAt,
      user.updatedAt
    );
  }
}

