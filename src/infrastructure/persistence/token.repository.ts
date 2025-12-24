import { ITokenRepository } from '../../domain/repositories/itoken-repository';
import { ICacheRepository } from '../../domain/repositories/icache-repository';
import { prisma } from '../config/database';
import { jwtConfig } from '../config/jwt.config';
import crypto from 'crypto';

export class TokenRepository implements ITokenRepository {
  private readonly TOKEN_CACHE_TTL = parseInt(process.env.REDIS_TTL_TOKEN || '60', 10); // 1 minute default

  constructor(private cache?: ICacheRepository) {}

  private getCacheKey(token: string): string {
    return `token:${token}`;
  }
  async save(token: string, userId: string, expiresAt: Date): Promise<void> {
    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
    
    // Cache the token
    if (this.cache) {
      const cacheKey = this.getCacheKey(token);
      await this.cache.set(cacheKey, { userId, expiresAt }, this.TOKEN_CACHE_TTL);
    }
  }

  async findByToken(token: string): Promise<{ userId: string; expiresAt: Date } | null> {
    const cacheKey = this.getCacheKey(token);
    
    // Try cache first
    if (this.cache) {
      const cached = await this.cache.get<{ userId: string; expiresAt: Date }>(cacheKey);
      if (cached) {
        // Check if expired
        if (cached.expiresAt < new Date()) {
          await this.delete(token);
          return null;
        }
        return cached;
      }
    }

    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!refreshToken) return null;

    if (refreshToken.expiresAt < new Date()) {
      await this.delete(token);
      return null;
    }

    const result = {
      userId: refreshToken.userId,
      expiresAt: refreshToken.expiresAt,
    };
    
    // Cache the result
    if (this.cache) {
      await this.cache.set(cacheKey, result, this.TOKEN_CACHE_TTL);
    }

    return result;
  }

  async delete(token: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
    
    // Invalidate cache
    if (this.cache) {
      await this.cache.delete(this.getCacheKey(token));
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async deleteExpired(): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  async generatePasswordResetToken(userId: string, expiresInSeconds: number): Promise<string> {
    if(!jwtConfig.secret){
      throw new Error('JWT_SECRET is not defined in environment variables');
    }
    // const token = Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);
    const hashToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const signature = crypto.createHmac('sha256', jwtConfig.secret)
    .update(`${userId}:${hashToken}:${expiresInSeconds}`)
    .digest('hex');
    const token = `${hashToken}.${signature}`;

    await prisma.passwordResetToken.create({
      data: {
        id: Math.random().toString(36).substr(2, 15),
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  async validatePasswordResetToken(token: string): Promise<string | null> {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return null;
    }

    return resetToken.userId;
  }

  async invalidatePasswordResetToken(token: string): Promise<void> {
    await prisma.passwordResetToken.updateMany({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  async invalidateAllUserTokens(userId: string): Promise<void> {
    await this.deleteByUserId(userId);
    await prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}

