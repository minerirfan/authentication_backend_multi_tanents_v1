import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../../infrastructure/external/jwt.service';
import { RequestWithUser } from '../../../shared/types';
import { UnauthorizedException } from '../../../domain/exceptions/domain-exceptions';

export class AuthMiddleware {
  static authenticate(req: RequestWithUser, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[AUTH] No token provided. Headers:', req.headers);
        throw new UnauthorizedException('No token provided');
      }

      const token = authHeader.substring(7);
      console.log('[AUTH] Verifying token:', token.substring(0, 20) + '...');
      const payload = JwtService.verifyToken(token);
      console.log('[AUTH] Token verified successfully for user:', payload.userId);

      req.user = payload;
      req.tenantId = payload.tenantId || undefined;

      next();
    } catch (error: any) {
      console.log('[AUTH] Token verification failed:', error.message);
      next(new UnauthorizedException('Invalid or expired token'));
    }
  }
}

