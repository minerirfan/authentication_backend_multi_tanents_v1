import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ResponseFormatter } from '../responses/response-formatter';

export class ValidationMiddleware {
  static validate(validations: ValidationChain[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ResponseFormatter.error(
          res,
          'Validation failed',
          400,
          errors.array().map((err) => `${err.type === 'field' ? err.path : ''}: ${err.msg}`)
        );
      }

      next();
    };
  }
}

