import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { ITenantRepository } from '../../../domain/repositories/itenant-repository';
import { ITokenRepository } from '../../../domain/repositories/itoken-repository';
import { DomainException } from '../../../domain/exceptions/domain-exceptions';
import { Email } from '../../../domain/value-objects/email';

export interface ForgotPasswordDto {
  email: string;
  tenantSlug?: string;
}

export class ForgotPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private tenantRepository: ITenantRepository,
    private tokenRepository: ITokenRepository
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const email = new Email(dto.email);
    let tenantId: string | null = null;

    // If tenant slug provided, validate it
    if (dto.tenantSlug) {
      const tenant = await this.tenantRepository.findBySlug(dto.tenantSlug);
      if (!tenant) {
        throw new DomainException('Invalid tenant', 400);
      }
      tenantId = tenant.id;
    }

    // Find user by email and tenant
    const user = await this.userRepository.findByEmail(email.getValue(), tenantId);
    if (!user) {
      // Don't reveal if user exists for security
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = await this.tokenRepository.generatePasswordResetToken(
      user.id,
      3600 // 1 hour
    );

    // TODO: Send email with reset link
    // await emailService.sendPasswordResetEmail(user.email.value, resetToken);
    
    console.log(`Password reset token for ${user.email.getValue()}: ${resetToken}`);

    return { message: 'If the email exists, a password reset link has been sent' };
  }
}