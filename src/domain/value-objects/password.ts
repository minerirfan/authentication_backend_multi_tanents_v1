import { ValidationException } from '../exceptions/domain-exceptions';
import { validatePasswordPolicy, passwordPolicy } from '../../config/password-policy.config';

export class Password {
  private readonly value: string;

  constructor(password: string, isHashed: boolean = false) {
    if (!isHashed) {
      const validation = validatePasswordPolicy(password);
      if (!validation.isValid) {
        throw new ValidationException(
          `Password requirements: ${passwordPolicy.minLength}+ characters, ` +
          `${passwordPolicy.requireUppercase ? 'uppercase, ' : ''}` +
          `${passwordPolicy.requireLowercase ? 'lowercase, ' : ''}` +
          `${passwordPolicy.requireNumber ? 'number, ' : ''}` +
          `${passwordPolicy.requireSpecialChar ? `special char (${passwordPolicy.allowedSpecialChars})` : ''}`
        );
      }
    }
    this.value = password;
  }

  /**
   * Validate password against centralized policy
   * This method is kept for backward compatibility but delegates to policy config
   */
  private isValid(password: string): boolean {
    const validation = validatePasswordPolicy(password);
    return validation.isValid;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Password): boolean {
    return this.value === other.value;
  }
}

