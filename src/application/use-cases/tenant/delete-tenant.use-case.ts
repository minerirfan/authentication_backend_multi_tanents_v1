import { ITenantRepository } from '../../../domain/repositories/itenant-repository';
import { NotFoundException } from '../../../domain/exceptions/domain-exceptions';

export class DeleteTenantUseCase {
  constructor(private tenantRepository: ITenantRepository) {}

  async execute(tenantId: string): Promise<void> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant', tenantId);
    }

    await this.tenantRepository.delete(tenantId);
  }
}

