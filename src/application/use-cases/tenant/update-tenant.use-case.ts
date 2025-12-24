import { ITenantRepository } from '../../../domain/repositories/itenant-repository';
import { TenantEntity } from '../../../domain/entities/tenant.entity';
import { NotFoundException, ConflictException } from '../../../domain/exceptions/domain-exceptions';

export interface UpdateTenantDto {
  name: string;
  slug: string;
}

export class UpdateTenantUseCase {
  constructor(private tenantRepository: ITenantRepository) {}

  async execute(tenantId: string, dto: UpdateTenantDto): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant', tenantId);
    }

    // Check if slug is being changed and if new slug already exists
    if (dto.slug !== tenant.slug) {
      const existingTenant = await this.tenantRepository.findBySlug(dto.slug);
      if (existingTenant) {
        throw new ConflictException('Tenant slug already exists');
      }
    }

    // Update tenant
    const updatedTenant = new TenantEntity(
      tenant.id,
      dto.name,
      dto.slug,
      tenant.createdAt,
      new Date()
    );

    return await this.tenantRepository.update(updatedTenant);
  }
}

