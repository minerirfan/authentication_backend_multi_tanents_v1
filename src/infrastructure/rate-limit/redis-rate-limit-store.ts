import { createClient, RedisClientType } from 'redis';

/**
 * Custom Redis store for distributed rate limiting
 * Compatible with express-rate-limit v7
 */
export class RedisRateLimitStore {
  public client: RedisClientType | null = null;
  public prefix: string;
  private isConnected: boolean = false;

  constructor(prefix: string = 'rate_limit') {
    this.prefix = prefix;
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = createClient({ url: redisUrl });

      this.client.on('error', (err) => {
        console.error('Redis Rate Limit Store Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Rate Limit Store Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis Rate Limit Store Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis rate limit store:', error);
      this.isConnected = false;
    }
  }

  /**
   * Increment the counter for a given key
   * Returns the current count and reset time
   */
  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    if (!this.client || !this.isConnected) {
      // Fallback to in-memory counter if Redis is not available
      console.warn('Redis not connected, using fallback counter');
      return this.fallbackIncrement(key);
    }

    try {
      const fullKey = `${this.prefix}:${key}`;
      const now = Date.now();
      const ttl = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10) / 1000; // Convert to seconds

      // Use Redis INCR with expiration
      const result = await this.client.multi()
        .incr(fullKey)
        .expire(fullKey, ttl)
        .exec();

      if (!result || result[0].error) {
        throw new Error('Redis INCR failed');
      }

      const totalHits = result[0].response as number;
      const resetTime = new Date(now + ttl * 1000);

      // Log rate limit metrics
      this.logMetrics(key, totalHits);

      return { totalHits, resetTime };
    } catch (error) {
      console.error(`Redis rate limit increment error for key ${key}:`, error);
      // Fallback to in-memory counter
      return this.fallbackIncrement(key);
    }
  }

  /**
   * Decrement the counter for a given key
   */
  async decrement(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      this.fallbackDecrement(key);
      return;
    }

    try {
      const fullKey = `${this.prefix}:${key}`;
      await this.client.decr(fullKey);
    } catch (error) {
      console.error(`Redis rate limit decrement error for key ${key}:`, error);
      this.fallbackDecrement(key);
    }
  }

  /**
   * Reset the counter for a given key
   */
  async resetKey(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      this.fallbackReset(key);
      return;
    }

    try {
      const fullKey = `${this.prefix}:${key}`;
      await this.client.del(fullKey);
    } catch (error) {
      console.error(`Redis rate limit reset error for key ${key}:`, error);
      this.fallbackReset(key);
    }
  }

  /**
   * Fallback in-memory counters when Redis is unavailable
   */
  private fallbackCounters: Map<string, { count: number; resetTime: Date }> = new Map();

  private fallbackIncrement(key: string): { totalHits: number; resetTime: Date } {
    const now = Date.now();
    const ttl = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
    const resetTime = new Date(now + ttl);

    const existing = this.fallbackCounters.get(key);
    if (!existing || existing.resetTime < new Date()) {
      this.fallbackCounters.set(key, { count: 1, resetTime });
      return { totalHits: 1, resetTime };
    }

    const count = existing.count + 1;
    this.fallbackCounters.set(key, { count, resetTime });
    return { totalHits: count, resetTime };
  }

  private fallbackDecrement(key: string): void {
    const existing = this.fallbackCounters.get(key);
    if (existing && existing.count > 0) {
      this.fallbackCounters.set(key, { count: existing.count - 1, resetTime: existing.resetTime });
    }
  }

  private fallbackReset(key: string): void {
    this.fallbackCounters.delete(key);
  }

  /**
   * Log rate limit metrics for monitoring
   */
  private logMetrics(key: string, count: number): void {
    // Extract endpoint name from key for better metrics
    const parts = key.split(':');
    const endpoint = parts[parts.length - 1] || 'unknown';

    console.log(`[RateLimit] ${endpoint}: ${count} requests`);
  }

  /**
   * Get current rate limit statistics
   */
  async getStats(): Promise<{
    totalKeys: number;
    keys: Array<{ key: string; count: number; ttl: number }>;
  }> {
    if (!this.client || !this.isConnected) {
      return {
        totalKeys: this.fallbackCounters.size,
        keys: Array.from(this.fallbackCounters.entries()).map(([key, data]) => ({
          key,
          count: data.count,
          ttl: Math.max(0, data.resetTime.getTime() - Date.now()),
        })),
      };
    }

    try {
      const pattern = `${this.prefix}:*`;
      const keys = await this.client.keys(pattern);

      if (!keys || keys.length === 0) {
        return { totalKeys: 0, keys: [] };
      }

      const keyData = await Promise.all(
        keys.map(async (fullKey) => {
          const count = await this.client.get(fullKey);
          const ttl = await this.client.ttl(fullKey);
          return {
            key: fullKey.replace(`${this.prefix}:`, ''),
            count: parseInt(count || '0', 10),
            ttl,
          };
        })
      );

      return {
        totalKeys: keys.length,
        keys: keyData,
      };
    } catch (error) {
      console.error('Error getting rate limit stats:', error);
      return { totalKeys: 0, keys: [] };
    }
  }

  /**
   * Clear all rate limit counters
   */
  async clearAll(): Promise<void> {
    if (!this.client || !this.isConnected) {
      this.fallbackCounters.clear();
      return;
    }

    try {
      const pattern = `${this.prefix}:*`;
      const keys = await this.client.keys(pattern);
      if (keys && keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Error clearing rate limit counters:', error);
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Singleton instances for different rate limiters
const authStore = new RedisRateLimitStore('rate_limit:auth');
const generalStore = new RedisRateLimitStore('rate_limit:general');
const strictStore = new RedisRateLimitStore('rate_limit:strict');

export function getAuthRateLimitStore(): RedisRateLimitStore {
  return authStore;
}

export function getGeneralRateLimitStore(): RedisRateLimitStore {
  return generalStore;
}

export function getStrictRateLimitStore(): RedisRateLimitStore {
  return strictStore;
}
