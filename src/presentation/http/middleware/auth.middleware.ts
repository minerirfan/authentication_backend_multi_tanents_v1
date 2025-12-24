import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../../infrastructure/external/jwt.service';
import { RequestWithUser } from '../../../shared/types';
import { UnauthorizedException } from '../../../domain/exceptions/domain-exceptions';

export class AuthMiddleware {
  static authenticate(req: RequestWithUser, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('No token provided');
      }

      const token = authHeader.substring(7);
      const payload = JwtService.verifyToken(token);

      req.user = payload;
      req.tenantId = payload.tenantId || undefined;

      next();
    } catch (error) {
      next(new UnauthorizedException('Invalid or expired token'));
    }
  }
}

