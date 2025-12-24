import { body, param, ValidationChain } from 'express-validator';

export const createUserValidator: ValidationChain[] = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
  body('firstName').trim().isLength({ min: 1, max: 50 }).withMessage('First name is required (1-50 chars)'),
  body('lastName').trim().isLength({ min: 1, max: 50 }).withMessage('Last name is required (1-50 chars)'),
  body('roleIds').isArray().withMessage('Role IDs must be an array'),
  body('roleIds.*').isUUID().withMessage('Each role ID must be a valid UUID'),
];

export const updateUserValidator: ValidationChain[] = [
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .optional()
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
  body('firstName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('First name cannot be empty (1-50 chars)'),
  body('lastName').optional().trim().isLength({ min: 1, max: 50 }).withMessage('Last name cannot be empty (1-50 chars)'),
  body('roleIds').optional().isArray().withMessage('Role IDs must be an array'),
  body('roleIds.*').optional().isUUID().withMessage('Each role ID must be a valid UUID'),
];

export const userIdValidator: ValidationChain[] = [
  param('id').isUUID().withMessage('User ID must be a valid UUID'),
];

