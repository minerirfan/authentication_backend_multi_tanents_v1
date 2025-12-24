import { createClient } from 'redis';
import { ICacheRepository } from '../../domain/repositories/icache-repository';

export class RedisCacheRepository implements ICacheRepository {
  private client: ReturnType<typeof createClient> | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = createClient({ url: redisUrl });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Client Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis Client Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis client:', error);
      this.isConnected = false;
      // Continue without Redis - cache operations will be no-ops
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Redis get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error);
      // Fail silently - cache is optional
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (error) {
      console.error(`Redis delete error for key ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      await this.client.flushAll();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis exists error for key ${key}:`, error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

// Singleton instance
let cacheInstance: RedisCacheRepository | null = null;

export function getCacheInstance(): RedisCacheRepository {
  if (!cacheInstance) {
    cacheInstance = new RedisCacheRepository();
  }
  return cacheInstance;
}

