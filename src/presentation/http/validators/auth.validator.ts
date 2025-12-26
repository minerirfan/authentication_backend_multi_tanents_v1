import { body, ValidationChain } from 'express-validator';
import { passwordPolicy, getPasswordRequirements, validatePasswordPolicy } from '../../../config/password-policy.config';

export const onboardValidator: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: passwordPolicy.minLength, max: passwordPolicy.maxLength })
    .withMessage(`Password must be between ${passwordPolicy.minLength} and ${passwordPolicy.maxLength} characters`)
    .custom((value: string) => {
      const validation = validatePasswordPolicy(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
      }
      return true;
    })
    .withMessage(`Password must contain: ${getPasswordRequirements()}`),
  body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required (1-50 chars)'),
  body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required (1-50 chars)'),
];

export const registerValidator: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: passwordPolicy.minLength, max: passwordPolicy.maxLength })
    .withMessage(`Password must be between ${passwordPolicy.minLength} and ${passwordPolicy.maxLength} characters`)
    .custom((value: string) => {
      const validation = validatePasswordPolicy(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
      }
      return true;
    })
    .withMessage(`Password must contain: ${getPasswordRequirements()}`),
  body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required (1-50 chars)'),
  body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required (1-50 chars)'),
  body('tenantName').trim().isLength({ min: 1, max: 100 }).withMessage('Tenant name is required (1-100 chars)'),
  body('tenantSlug')
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Tenant slug must be 3-50 chars with lowercase letters, numbers, and hyphens'),
];

export const loginValidator: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('tenantSlug').optional().custom((value) => {
    if (value && typeof value === 'string' && value.trim() !== '') {
      if (!/^[a-z0-9-]+$/.test(value.trim())) {
        throw new Error('Invalid tenant slug format');
      }
    }
    return true;
  }),
];

export const refreshTokenValidator: ValidationChain[] = [
  body('refreshToken').isJWT().withMessage('Valid refresh token is required'),
];

export const forgotPasswordValidator: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('tenantSlug').optional().custom((value) => {
    if (value && typeof value === 'string' && value.trim() !== '') {
      if (!/^[a-z0-9-]+$/.test(value.trim())) {
        throw new Error('Invalid tenant slug format');
      }
    }
    return true;
  }),
];

export const resetPasswordValidator: ValidationChain[] = [
  body('token').isJWT().withMessage('Valid reset token is required'),
  body('password')
    .isLength({ min: passwordPolicy.minLength, max: passwordPolicy.maxLength })
    .withMessage(`Password must be between ${passwordPolicy.minLength} and ${passwordPolicy.maxLength} characters`)
    .custom((value: string) => {
      const validation = validatePasswordPolicy(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('. '));
      }
      return true;
    })
    .withMessage(`Password must contain: ${getPasswordRequirements()}`),
];