import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { ITokenRepository } from '../../../domain/repositories/itoken-repository';
import { IPasswordHasher } from '../../../domain/services/ipassword-hasher';
import { DomainException } from '../../../domain/exceptions/domain-exceptions';
import { Password } from '../../../domain/value-objects/password';

export interface ResetPasswordDto {
  token: string;
  password: string;
}

export class ResetPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private tokenRepository: ITokenRepository,
    private passwordHasher: IPasswordHasher
  ) {}

  async execute(dto: ResetPasswordDto): Promise<{ message: string }> {
    // Validate and consume reset token
    const userId = await this.tokenRepository.validatePasswordResetToken(dto.token);
    if (!userId) {
      throw new DomainException('Invalid or expired reset token', 400);
    }

    // Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new DomainException('User not found', 404);
    }

    // Create new password
    const newPassword = new Password(dto.password);
    const hashedPassword = await this.passwordHasher.hash(newPassword.getValue());
    const hashedPasswordObj = new Password(hashedPassword);

    // Update user password
    user.updatePassword(hashedPasswordObj);
    await this.userRepository.update(user);

    // Invalidate the reset token
    await this.tokenRepository.invalidatePasswordResetToken(dto.token);

    // Invalidate all user sessions for security
    await this.tokenRepository.invalidateAllUserTokens(userId);

    return { message: 'Password reset successfully' };
  }
}