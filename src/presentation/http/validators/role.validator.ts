import { body, ValidationChain } from 'express-validator';

export const createRoleValidator: ValidationChain[] = [
  body('name').notEmpty().withMessage('Role name is required'),
  body('description').optional().isString(),
  body('permissionIds').isArray().withMessage('Permission IDs must be an array'),
  body('permissionIds.*').isUUID().withMessage('Each permission ID must be a valid UUID'),
];

export const updateRoleValidator: ValidationChain[] = [
  body('name').optional().notEmpty().withMessage('Role name cannot be empty'),
  body('description').optional().isString(),
  body('permissionIds').optional().isArray().withMessage('Permission IDs must be an array'),
  body('permissionIds.*').optional().isUUID().withMessage('Each permission ID must be a valid UUID'),
];

