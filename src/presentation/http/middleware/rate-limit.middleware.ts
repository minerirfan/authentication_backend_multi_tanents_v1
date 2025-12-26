import rateLimit, { MemoryStore, Options } from 'express-rate-limit';
import { RedisRateLimitStore, getAuthRateLimitStore, getGeneralRateLimitStore, getStrictRateLimitStore } from '../../../infrastructure/rate-limit/redis-rate-limit-store';

// Rate limit configuration from environment variables with defaults
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // 100 requests
const RATE_LIMIT_AUTH_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || '5', 10); // 5 auth requests
const STRICT_RATE_LIMIT_WINDOW_MS = parseInt(process.env.STRICT_RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute
const STRICT_RATE_LIMIT_MAX = parseInt(process.env.STRICT_RATE_LIMIT_MAX || '10', 10); // 10 requests

// Disable rate limiting in development if explicitly set
const DISABLE_RATE_LIMITING = process.env.DISABLE_RATE_LIMITING === 'true' || process.env.NODE_ENV === 'development';

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

// Use Redis store if available, otherwise use memory store
const USE_REDIS_STORE = process.env.USE_REDIS_RATE_LIMIT === 'true';

/**
 * Create a custom store adapter for express-rate-limit v7
 */
function createStoreAdapter(redisStore: RedisRateLimitStore) {
  const store = new MemoryStore();

  // Override the increment method to use Redis
  const originalIncrement = store.increment;
  store.increment = async (key: string) => {
    if (!redisStore.client || redisStore.prefix === '') {
      return originalIncrement.call(store, key);
    }

    try {
      const result = await redisStore.increment(key);
      return {
        totalHits: result.totalHits,
        resetTime: result.resetTime,
      };
    } catch (error) {
      console.error('Redis store increment error, falling back to memory:', error);
      return originalIncrement.call(store, key);
    }
  };

  // Override the decrement method to use Redis
  const originalDecrement = store.decrement;
  store.decrement = async (key: string) => {
    if (!redisStore.client || redisStore.prefix === '') {
      return originalDecrement?.call(store, key);
    }

    try {
      await redisStore.decrement(key);
    } catch (error) {
      console.error('Redis store decrement error, falling back to memory:', error);
      originalDecrement?.call(store, key);
    }
  };

  // Override the resetKey method to use Redis
  const originalResetKey = store.resetKey;
  store.resetKey = async (key: string) => {
    if (!redisStore.client || redisStore.prefix === '') {
      return originalResetKey?.call(store, key);
    }

    try {
      await redisStore.resetKey(key);
    } catch (error) {
      console.error('Redis store resetKey error, falling back to memory:', error);
      originalResetKey?.call(store, key);
    }
  };

  return store;
}

/**
 * Rate limiter for authentication endpoints
 * Default: 5 requests per 15 minutes
 * Uses Redis for distributed rate limiting if configured
 */
export const authRateLimiter = DISABLE_RATE_LIMITING
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_AUTH_MAX_REQUESTS,
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      message: {
        success: false,
        message: 'Too many login attempts, please try again later',
        statusCode: 429,
        errors: ['Rate limit exceeded. Please wait before trying again.'],
      },
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          message: 'Too many login attempts, please try again later',
          statusCode: 429,
          errors: ['Rate limit exceeded. Please wait before trying again.'],
        });
      },
      // Use Redis store if configured, otherwise use memory store
      ...(USE_REDIS_STORE && {
        store: createStoreAdapter(getAuthRateLimitStore()),
      }),
    });

/**
 * Rate limiter for general endpoints
 * Default: 100 requests per 15 minutes
 * Uses Redis for distributed rate limiting if configured
 */
export const generalRateLimiter = DISABLE_RATE_LIMITING
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests, please try again later',
        statusCode: 429,
        errors: ['Rate limit exceeded. Please wait before trying again.'],
      },
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later',
          statusCode: 429,
          errors: ['Rate limit exceeded. Please wait before trying again.'],
        });
      },
      ...(USE_REDIS_STORE && {
        store: createStoreAdapter(getGeneralRateLimitStore()),
      }),
    });

/**
 * Rate limiter for sensitive operations (create, update, delete)
 * Default: 10 requests per minute
 * Configure via STRICT_RATE_LIMIT_MAX and STRICT_RATE_LIMIT_WINDOW_MS environment variables
 * Uses Redis for distributed rate limiting if configured
 */
export const strictRateLimiter = DISABLE_RATE_LIMITING
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: STRICT_RATE_LIMIT_WINDOW_MS,
      max: STRICT_RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests for this operation, please try again later',
        statusCode: 429,
        errors: ['Rate limit exceeded. Please wait before trying again.'],
      },
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          message: 'Too many requests for this operation, please try again later',
          statusCode: 429,
          errors: ['Rate limit exceeded. Please wait before trying again.'],
        });
      },
      ...(USE_REDIS_STORE && {
        store: createStoreAdapter(getStrictRateLimitStore()),
      }),
    });

/**
 * Rate limiter for public endpoints (less restrictive)
 * Default: 200 requests per 15 minutes
 */
export const publicRateLimiter = DISABLE_RATE_LIMITING
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX_REQUESTS || '200', 10),
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests, please try again later',
        statusCode: 429,
        errors: ['Rate limit exceeded. Please wait before trying again.'],
      },
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later',
          statusCode: 429,
          errors: ['Rate limit exceeded. Please wait before trying again.'],
        });
      },
      ...(USE_REDIS_STORE && {
        store: createStoreAdapter(getGeneralRateLimitStore()),
      }),
    });

/**
 * Rate limiter for API documentation endpoints
 * Default: 50 requests per minute
 */
export const docsRateLimiter = DISABLE_RATE_LIMITING
  ? (req: any, res: any, next: any) => next()
  : rateLimit({
      windowMs: 60000, // 1 minute
      max: parseInt(process.env.RATE_LIMIT_DOCS_MAX_REQUESTS || '50', 10),
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: 'Too many requests to API documentation, please try again later',
        statusCode: 429,
        errors: ['Rate limit exceeded. Please wait before trying again.'],
      },
      handler: (req, res) => {
        res.status(429).json({
          success: false,
          message: 'Too many requests to API documentation, please try again later',
          statusCode: 429,
          errors: ['Rate limit exceeded. Please wait before trying again.'],
        });
      },
      ...(USE_REDIS_STORE && {
        store: createStoreAdapter(getGeneralRateLimitStore()),
      }),
    });

/**
 * Get rate limit statistics
 * Useful for monitoring and debugging
 */
export async function getRateLimitStats(): Promise<{
  auth: Awaited<ReturnType<RedisRateLimitStore['getStats']>>;
  general: Awaited<ReturnType<RedisRateLimitStore['getStats']>>;
  strict: Awaited<ReturnType<RedisRateLimitStore['getStats']>>;
  usingRedis: boolean;
}> {
  if (!USE_REDIS_STORE) {
    return {
      auth: { totalKeys: 0, keys: [] },
      general: { totalKeys: 0, keys: [] },
      strict: { totalKeys: 0, keys: [] },
      usingRedis: false,
    };
  }

  const [auth, general, strict] = await Promise.all([
    getAuthRateLimitStore().getStats(),
    getGeneralRateLimitStore().getStats(),
    getStrictRateLimitStore().getStats(),
  ]);

  return {
    auth,
    general,
    strict,
    usingRedis: true,
  };
}

/**
 * Clear all rate limit counters
 * Useful for testing or manual intervention
 */
export async function clearRateLimitCounters(): Promise<void> {
  if (!USE_REDIS_STORE) {
    return;
  }

  await Promise.all([
    getAuthRateLimitStore().clearAll(),
    getGeneralRateLimitStore().clearAll(),
    getStrictRateLimitStore().clearAll(),
  ]);
}
