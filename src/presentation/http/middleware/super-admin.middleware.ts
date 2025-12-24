import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import { ForbiddenException } from '../../../domain/exceptions/domain-exceptions';

export class SuperAdminMiddleware {
  static requireSuperAdmin(req: RequestWithUser, res: Response, next: NextFunction): void {
    if (!req.user || !req.user.isSuperAdmin) {
      return next(new ForbiddenException('Super admin access required'));
    }
    next();
  }
}

