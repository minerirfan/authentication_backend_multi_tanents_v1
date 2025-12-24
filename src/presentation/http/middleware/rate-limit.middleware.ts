import rateLimit from 'express-rate-limit';

// Rate limit configuration from environment variables with defaults
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // 100 requests
const RATE_LIMIT_AUTH_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || '5', 10); // 5 auth requests
const STRICT_RATE_LIMIT_WINDOW_MS = parseInt(process.env.STRICT_RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute
const STRICT_RATE_LIMIT_MAX = parseInt(process.env.STRICT_RATE_LIMIT_MAX || '10', 10); // 10 requests

// Validate rate limit values
if (RATE_LIMIT_AUTH_MAX_REQUESTS < 1 || RATE_LIMIT_AUTH_MAX_REQUESTS > 100) {
  throw new Error('RATE_LIMIT_AUTH_MAX_REQUESTS must be between 1 and 100');
}
if (RATE_LIMIT_MAX_REQUESTS < 1 || RATE_LIMIT_MAX_REQUESTS > 10000) {
  throw new Error('RATE_LIMIT_MAX_REQUESTS must be between 1 and 10000');
}
if (STRICT_RATE_LIMIT_MAX < 1 || STRICT_RATE_LIMIT_MAX > 100) {
  throw new Error('STRICT_RATE_LIMIT_MAX must be between 1 and 100');
}

/**
 * Rate limiter for authentication endpoints
 * Default: 5 requests per 15 minutes
 */
export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_AUTH_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
    statusCode: 429,
    errors: ['Rate limit exceeded. Please wait before trying again.'],
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Rate limiter for general endpoints
 * Default: 100 requests per 15 minutes
 */
export const generalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    statusCode: 429,
    errors: ['Rate limit exceeded. Please wait before trying again.'],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for sensitive operations (create, update, delete)
 * Default: 10 requests per minute
 * Configure via STRICT_RATE_LIMIT_MAX and STRICT_RATE_LIMIT_WINDOW_MS environment variables
 */
export const strictRateLimiter = rateLimit({
  windowMs: STRICT_RATE_LIMIT_WINDOW_MS,
  max: STRICT_RATE_LIMIT_MAX,
  message: {
    success: false,
    message: 'Too many requests for this operation, please try again later',
    statusCode: 429,
    errors: ['Rate limit exceeded. Please wait before trying again.'],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

