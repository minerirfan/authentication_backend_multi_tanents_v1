import { IUserRepository } from '../repositories/iuser-repository';
import { BusinessRuleException } from '../exceptions/domain-exceptions';

export class AdminLimitService {
  private readonly MAX_ADMINS_PER_TENANT = 2;

  /**
   * Validate that the tenant has not exceeded the maximum number of admins
   * @param tenantId - The tenant ID to check
   * @param userRepository - User repository to count admins
   * @throws BusinessRuleException if limit is exceeded
   */
  async validateAdminLimit(
    tenantId: string,
    userRepository: IUserRepository
  ): Promise<void> {
    const adminCount = await userRepository.countAdmins(tenantId);
    if (adminCount >= this.MAX_ADMINS_PER_TENANT) {
      throw new BusinessRuleException(
        `Maximum ${this.MAX_ADMINS_PER_TENANT} admins allowed per tenant`
      );
    }
  }

  /**
   * Check if deleting an admin would leave the tenant without any admins
   * @param tenantId - The tenant ID
   * @param userRepository - User repository to count admins
   * @throws BusinessRuleException if this would be the last admin
   */
  async validateNotLastAdmin(
    tenantId: string,
    userRepository: IUserRepository
  ): Promise<void> {
    const adminCount = await userRepository.countAdmins(tenantId);
    if (adminCount <= 1) {
      throw new BusinessRuleException('Cannot delete the last admin user in the tenant');
    }
  }
}

