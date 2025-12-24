import { ValidationException } from '../exceptions/domain-exceptions';

export class Email {
  private readonly value: string;

  constructor(email: string) {
    if (!email || typeof email !== 'string') {
      throw new ValidationException('Invalid email format');
    }
    const trimmedEmail = email.trim();
    if (!this.isValid(trimmedEmail)) {
      throw new ValidationException('Invalid email format');
    }
    this.value = trimmedEmail.toLowerCase();
  }

  private isValid(email: string): boolean {
    if (!email || email.length === 0) {
      return false;
    }
    // More comprehensive email regex that handles various TLDs including .pk, .co.uk, etc.
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

