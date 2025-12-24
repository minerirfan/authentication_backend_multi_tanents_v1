import { Password } from '../password';
import { ValidationException } from '../../exceptions/domain-exceptions';

describe('Password Value Object', () => {
  describe('constructor', () => {
    it('should create a valid password', () => {
      const password = new Password('SecurePass123');
      expect(password.getValue()).toBe('SecurePass123');
    });

    it('should throw ValidationException for password less than 8 characters', () => {
      expect(() => new Password('Short1')).toThrow(ValidationException);
    });

    it('should throw ValidationException for password without uppercase', () => {
      expect(() => new Password('lowercase123')).toThrow(ValidationException);
    });

    it('should throw ValidationException for password without lowercase', () => {
      expect(() => new Password('UPPERCASE123')).toThrow(ValidationException);
    });

    it('should throw ValidationException for password without number', () => {
      expect(() => new Password('NoNumbers')).toThrow(ValidationException);
    });

    it('should accept valid password', () => {
      expect(() => new Password('ValidPass123')).not.toThrow();
      expect(() => new Password('Another1Pass')).not.toThrow();
    });

    it('should accept hashed password without validation', () => {
      const hashed = '$2b$10$hashedpasswordstring';
      expect(() => new Password(hashed, true)).not.toThrow();
      const password = new Password(hashed, true);
      expect(password.getValue()).toBe(hashed);
    });
  });

  describe('equals', () => {
    it('should return true for equal passwords', () => {
      const password1 = new Password('SecurePass123');
      const password2 = new Password('SecurePass123');
      expect(password1.equals(password2)).toBe(true);
    });

    it('should return false for different passwords', () => {
      const password1 = new Password('SecurePass123');
      const password2 = new Password('Different123');
      expect(password1.equals(password2)).toBe(false);
    });
  });
});

