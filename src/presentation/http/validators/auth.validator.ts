import { body, ValidationChain } from 'express-validator';

export const onboardValidator: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
  body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required (1-50 chars)'),
  body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required (1-50 chars)'),
];

export const registerValidator: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
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
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
];