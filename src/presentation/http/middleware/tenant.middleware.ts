import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import { UnauthorizedException } from '../../../domain/exceptions/domain-exceptions';

export class TenantMiddleware {
  static extractTenant(req: RequestWithUser, res: Response, next: NextFunction): void {
    if (!req.user) {
      return next(new UnauthorizedException('User information missing'));
    }

    // Super admin can bypass tenant restrictions
    if (req.user.isSuperAdmin) {
      req.tenantId = undefined; // Super admin doesn't have tenant restriction
      return next();
    }

    if (!req.user.tenantId) {
      return next(new UnauthorizedException('Tenant information missing'));
    }

    req.tenantId = req.user.tenantId;
    next();
  }
}

