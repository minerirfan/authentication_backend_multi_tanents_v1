import { ValidationException } from '../exceptions/domain-exceptions';

export class Password {
  private readonly value: string;

  constructor(password: string, isHashed: boolean = false) {
    if (!isHashed && !this.isValid(password)) {
      throw new ValidationException(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
      );
    }
    this.value = password;
  }

  private isValid(password: string): boolean {
    if (password.length < 8) {
      return false;
    }
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Password): boolean {
    return this.value === other.value;
  }
}

