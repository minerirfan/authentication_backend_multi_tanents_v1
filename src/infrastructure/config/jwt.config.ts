// Validate required JWT secrets
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
  throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long');
}

export const jwtConfig = {
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  algorithm: 'HS256' as const,
  issuer: 'auth-system',
  audience: 'auth-system-users',
};

