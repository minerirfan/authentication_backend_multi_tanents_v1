import { Email } from '../email';
import { ValidationException } from '../../exceptions/domain-exceptions';

describe('Email Value Object', () => {
  describe('constructor', () => {
    it('should create a valid email', () => {
      const email = new Email('test@example.com');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should convert email to lowercase', () => {
      const email = new Email('TEST@EXAMPLE.COM');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = new Email('  test@example.com  ');
      expect(email.getValue()).toBe('test@example.com');
    });

    it('should throw ValidationException for invalid email', () => {
      expect(() => new Email('invalid-email')).toThrow(ValidationException);
      expect(() => new Email('@example.com')).toThrow(ValidationException);
      expect(() => new Email('test@')).toThrow(ValidationException);
    });

    it('should throw ValidationException for empty email', () => {
      expect(() => new Email('')).toThrow(ValidationException);
      expect(() => new Email('   ')).toThrow(ValidationException);
    });

    it('should accept valid email formats', () => {
      expect(() => new Email('user@example.com')).not.toThrow();
      expect(() => new Email('user.name@example.com')).not.toThrow();
      expect(() => new Email('user+tag@example.co.uk')).not.toThrow();
    });
  });

  describe('equals', () => {
    it('should return true for equal emails', () => {
      const email1 = new Email('test@example.com');
      const email2 = new Email('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = new Email('test1@example.com');
      const email2 = new Email('test2@example.com');
      expect(email1.equals(email2)).toBe(false);
    });

    it('should be case-insensitive', () => {
      const email1 = new Email('TEST@EXAMPLE.COM');
      const email2 = new Email('test@example.com');
      expect(email1.equals(email2)).toBe(true);
    });
  });

  describe('toString', () => {
    it('should return email value as string', () => {
      const email = new Email('test@example.com');
      expect(email.toString()).toBe('test@example.com');
    });
  });
});

