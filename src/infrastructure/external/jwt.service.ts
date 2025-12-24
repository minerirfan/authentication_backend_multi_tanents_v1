import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config';
import { JwtPayload } from '../../shared/types';

export class JwtService {
  static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.accessExpiresIn,
    } as jwt.SignOptions);
  }

  static generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    } as jwt.SignOptions);
  }

  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, jwtConfig.secret) as JwtPayload;
    } catch (error: any) {
      // Preserve the original error for better error handling
      if (error.name === 'TokenExpiredError') {
        const expiredError = new Error('Token has expired');
        (expiredError as any).name = 'TokenExpiredError';
        throw expiredError;
      }
      if (error.name === 'JsonWebTokenError') {
        const invalidError = new Error('Token signature is invalid');
        (invalidError as any).name = 'JsonWebTokenError';
        throw invalidError;
      }
      throw error;
    }
  }

  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }
}

