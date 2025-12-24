import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '../../../shared/types';
import { ForbiddenException } from '../../../domain/exceptions/domain-exceptions';
import { ROLE_NAMES } from '../../../domain/constants/role-names';

export class AdminMiddleware {
  /**
   * Requires user to be either super admin or tenant admin (has 'admin' role)
   */
  static requireAdmin(req: RequestWithUser, res: Response, next: NextFunction): void {
    if (!req.user) {
      return next(new ForbiddenException('Authentication required'));
    }

    // Super admin has access
    if (req.user.isSuperAdmin) {
      return next();
    }

    // Check if user has 'admin' role
    const hasAdminRole = req.user.roles?.includes(ROLE_NAMES.ADMIN) || false;
    if (!hasAdminRole) {
      return next(new ForbiddenException('Admin access required'));
    }

    next();
  }
}

