/**
 * Centralized Password Policy Configuration
 * 
 * This configuration is used across all layers (domain, application, presentation)
 * to ensure consistent password validation and requirements.
 */

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  allowedSpecialChars: string;
  commonPasswords: string[];
  maxHistory: number; // Number of previous passwords to check
  expiryDays: number; // Password expiry in days (0 = never expires)
}

/**
 * Default password policy
 * Can be overridden by environment variables
 */
export const passwordPolicy: PasswordPolicy = {
  // Length requirements
  minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
  maxLength: parseInt(process.env.PASSWORD_MAX_LENGTH || '128', 10),
  
  // Character requirements
  requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
  requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
  requireNumber: process.env.PASSWORD_REQUIRE_NUMBER !== 'false',
  requireSpecialChar: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
  
  // Allowed special characters
  allowedSpecialChars: process.env.PASSWORD_SPECIAL_CHARS || '@$!%*?&',
  
  // Common passwords to block
  commonPasswords: [
    'password',
    '123456',
    '12345678',
    'qwerty',
    'abc123',
    'letmein',
    'admin',
    'welcome',
    'monkey',
    'sunshine',
    'password1',
    '1234567890',
    'iloveyou',
    'princess',
    'dragon',
    'football',
    'baseball',
    'trustno1',
    'master',
    'hello',
    'whatever',
  ],
  
  // Password history and expiry
  maxHistory: parseInt(process.env.PASSWORD_MAX_HISTORY || '5', 10),
  expiryDays: parseInt(process.env.PASSWORD_EXPIRY_DAYS || '0', 10), // 0 = never expires
};

/**
 * Validate password against policy
 * @param password - Password to validate
 * @returns Object with isValid flag and array of error messages
 */
export function validatePasswordPolicy(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check length
  if (password.length < passwordPolicy.minLength) {
    errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
  }
  if (password.length > passwordPolicy.maxLength) {
    errors.push(`Password must not exceed ${passwordPolicy.maxLength} characters`);
  }

  // Check uppercase
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check lowercase
  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check number
  if (passwordPolicy.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check special character
  if (passwordPolicy.requireSpecialChar) {
    const specialCharRegex = new RegExp(`[${passwordPolicy.allowedSpecialChars.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]`);
    if (!specialCharRegex.test(password)) {
      errors.push(
        `Password must contain at least one special character (${passwordPolicy.allowedSpecialChars})`
      );
    }
  }

  // Check common passwords
  const lowerPassword = password.toLowerCase();
  if (passwordPolicy.commonPasswords.some(common => lowerPassword.includes(common))) {
    errors.push('Password is too common. Please choose a more secure password');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate password requirements description for user feedback
 */
export function getPasswordRequirements(): string {
  const requirements: string[] = [];
  
  requirements.push(`at least ${passwordPolicy.minLength} characters`);
  
  if (passwordPolicy.requireUppercase) {
    requirements.push('one uppercase letter');
  }
  
  if (passwordPolicy.requireLowercase) {
    requirements.push('one lowercase letter');
  }
  
  if (passwordPolicy.requireNumber) {
    requirements.push('one number');
  }
  
  if (passwordPolicy.requireSpecialChar) {
    requirements.push(`one special character (${passwordPolicy.allowedSpecialChars})`);
  }
  
  return requirements.join(', ');
}
