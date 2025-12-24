export interface ITokenRepository {
  save(token: string, userId: string, expiresAt: Date): Promise<void>;
  findByToken(token: string): Promise<{ userId: string; expiresAt: Date } | null>;
  delete(token: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<void>;
  generatePasswordResetToken(userId: string, expiresInSeconds: number): Promise<string>;
  validatePasswordResetToken(token: string): Promise<string | null>;
  invalidatePasswordResetToken(token: string): Promise<void>;
  invalidateAllUserTokens(userId: string): Promise<void>;
}

