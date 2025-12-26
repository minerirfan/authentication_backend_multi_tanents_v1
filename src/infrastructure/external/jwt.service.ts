import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config';
import { JwtPayload } from '../../shared/types';

// Extended payload with token type and version
export interface ExtendedJwtPayload extends JwtPayload {
  type: 'access' | 'refresh';
  version?: number;
}

export class JwtService {
  static generateAccessToken(payload: JwtPayload, tokenVersion: number = 1): string {
    const extendedPayload: ExtendedJwtPayload = {
      ...payload,
      type: 'access',
      version: tokenVersion,
    };
    return jwt.sign(extendedPayload, jwtConfig.secret, {
      expiresIn: jwtConfig.accessExpiresIn,
    } as jwt.SignOptions);
  }

  static generateRefreshToken(payload: JwtPayload, tokenVersion: number = 1): string {
    const extendedPayload: ExtendedJwtPayload = {
      ...payload,
      type: 'refresh',
      version: tokenVersion,
    };
    return jwt.sign(extendedPayload, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    } as jwt.SignOptions);
  }

  static verifyToken(token: string): ExtendedJwtPayload {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret) as ExtendedJwtPayload;
      // Verify token type
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type: expected access token');
      }
      return decoded;
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

  static verifyRefreshToken(token: string): ExtendedJwtPayload {
    try {
      const decoded = jwt.verify(token, jwtConfig.refreshSecret) as ExtendedJwtPayload;
      // Verify token type
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type: expected refresh token');
      }
      return decoded;
    } catch (error: any) {
      // Preserve the original error for better error handling
      if (error.name === 'TokenExpiredError') {
        const expiredError = new Error('Refresh token has expired');
        (expiredError as any).name = 'TokenExpiredError';
        throw expiredError;
      }
      if (error.name === 'JsonWebTokenError') {
        const invalidError = new Error('Refresh token signature is invalid');
        (invalidError as any).name = 'JsonWebTokenError';
        throw invalidError;
      }
      throw error;
    }
  }

  static decodeToken(token: string): ExtendedJwtPayload | null {
    try {
      return jwt.decode(token) as ExtendedJwtPayload;
    } catch {
      return null;
    }
  }
}

