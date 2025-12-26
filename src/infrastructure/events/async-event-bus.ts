import { DomainEvent } from '../../domain/events/domain-event';
import { createClient, RedisClientType } from 'redis';
import { IEventStore } from './ievent-store';

/**
 * Type for event handler functions
 */
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void;

/**
 * Event metadata for tracking
 */
export interface EventMetadata {
  id: string;
  eventName: string;
  publishedAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  error?: string;
}

/**
 * Configuration for async event bus
 */
export interface AsyncEventBusConfig {
  enablePersistence: boolean;
  enableRedisPubSub: boolean;
  maxRetries: number;
  retryDelayMs: number;
  deadLetterQueueMaxSize: number;
}

/**
 * Async event bus with persistence, Redis Pub/Sub, and dead letter queue
 */
export class AsyncEventBus {
  private handlers = new Map<string, EventHandler[]>();
  private redisClient: RedisClientType | null = null;
  private redisConnected: boolean = false;
  private eventStore: IEventStore | null = null;
  private deadLetterQueue: DomainEvent[] = [];
  private config: AsyncEventBusConfig;
  private processingQueue = new Set<string>();

  constructor(
    config: Partial<AsyncEventBusConfig> = {},
    eventStore?: IEventStore
  ) {
    this.config = {
      enablePersistence: config.enablePersistence ?? true,
      enableRedisPubSub: config.enableRedisPubSub ?? true,
      maxRetries: config.maxRetries ?? 3,
      retryDelayMs: config.retryDelayMs ?? 1000,
      deadLetterQueueMaxSize: config.deadLetterQueueMaxSize ?? 1000,
    };
    this.eventStore = eventStore || null;

    if (this.config.enableRedisPubSub) {
      this.initializeRedis();
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redisClient = createClient({ url: redisUrl });

      this.redisClient.on('error', (err) => {
        console.error('Redis Event Bus Error:', err);
        this.redisConnected = false;
      });

      this.redisClient.on('connect', () => {
        console.log('Redis Event Bus Connected');
        this.redisConnected = true;
      });

      this.redisClient.on('disconnect', () => {
        console.log('Redis Event Bus Disconnected');
        this.redisConnected = false;
      });

      await this.redisClient.connect();

      // Subscribe to event channel
      await this.redisClient.subscribe('domain-events', (message) => {
        this.handleRedisMessage(message);
      });
    } catch (error) {
      console.error('Failed to initialize Redis event bus:', error);
      this.redisConnected = false;
    }
  }

  /**
   * Subscribe to an event type
   * @param eventName - Name of the event to subscribe to
   * @param handler - Handler function to call when event is published
   */
  subscribe<T extends DomainEvent>(eventName: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, []);
    }
    this.handlers.get(eventName)!.push(handler as EventHandler);
  }

  /**
   * Publish an event asynchronously
   * @param event - The domain event to publish
   * @returns Promise that resolves when event is queued for processing
   */
  async publish(event: DomainEvent): Promise<void> {
    const eventId = `${event.getEventName()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metadata: EventMetadata = {
      id: eventId,
      eventName: event.getEventName(),
      publishedAt: new Date(),
      status: 'pending',
      retryCount: 0,
    };

    // Persist event if enabled
    if (this.config.enablePersistence && this.eventStore) {
      try {
        await this.eventStore.saveEvent(event, metadata);
      } catch (error) {
        console.error('Failed to persist event:', error);
      }
    }

    // Publish to Redis Pub/Sub if enabled
    if (this.config.enableRedisPubSub && this.redisConnected) {
      try {
        const message = JSON.stringify({
          event,
          metadata,
        });
        await this.redisClient!.publish('domain-events', message);
      } catch (error) {
        console.error('Failed to publish event to Redis:', error);
      }
    }

    // Queue event for local processing
    this.queueEventForProcessing(event, metadata);
  }

  /**
   * Queue event for async processing
   */
  private queueEventForProcessing(event: DomainEvent, metadata: EventMetadata): void {
    // Use setImmediate to process in next tick
    setImmediate(() => {
      this.processEvent(event, metadata);
    });
  }

  /**
   * Process an event with retry logic
   */
  private async processEvent(event: DomainEvent, metadata: EventMetadata): Promise<void> {
    const eventName = event.getEventName();
    const handlers = this.handlers.get(eventName) || [];

    if (handlers.length === 0) {
      console.log(`No handlers for event: ${eventName}`);
      return;
    }

    // Check if already processing
    if (this.processingQueue.has(metadata.id)) {
      console.log(`Event ${metadata.id} is already being processed`);
      return;
    }

    this.processingQueue.add(metadata.id);

    try {
      metadata.status = 'processing';
      metadata.processedAt = new Date();

      // Execute all handlers
      const promises = handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          console.error(`Error in handler for event ${eventName}:`, error);
          throw error;
        }
      });

      await Promise.allSettled(promises);

      metadata.status = 'completed';

      // Update event store if enabled
      if (this.config.enablePersistence && this.eventStore) {
        await this.eventStore.updateEventMetadata(metadata.id, metadata);
      }
    } catch (error) {
      console.error(`Failed to process event ${metadata.id}:`, error);
      metadata.status = 'failed';
      metadata.error = error instanceof Error ? error.message : 'Unknown error';

      // Retry logic
      if (metadata.retryCount < this.config.maxRetries) {
        metadata.retryCount++;
        console.log(`Retrying event ${metadata.id} (attempt ${metadata.retryCount}/${this.config.maxRetries})`);

        // Update event store
        if (this.config.enablePersistence && this.eventStore) {
          await this.eventStore.updateEventMetadata(metadata.id, metadata);
        }

        // Schedule retry
        setTimeout(() => {
          this.processEvent(event, metadata);
        }, this.config.retryDelayMs * metadata.retryCount);
      } else {
        console.error(`Max retries exceeded for event ${metadata.id}, adding to dead letter queue`);
        this.addToDeadLetterQueue(event, metadata);
      }
    } finally {
      this.processingQueue.delete(metadata.id);
    }
  }

  /**
   * Handle Redis message (distributed events)
   */
  private async handleRedisMessage(message: string): Promise<void> {
    try {
      const data = JSON.parse(message);
      const event = data.event as DomainEvent;
      const metadata = data.metadata as EventMetadata;

      // Don't process events published by this instance
      // (This is a simple check; in production, use instance IDs)
      const instanceId = process.env.INSTANCE_ID || 'default';
      if (metadata.id.includes(instanceId)) {
        return;
      }

      this.queueEventForProcessing(event, metadata);
    } catch (error) {
      console.error('Failed to handle Redis message:', error);
    }
  }

  /**
   * Add event to dead letter queue
   */
  private addToDeadLetterQueue(event: DomainEvent, metadata: EventMetadata): void {
    // Enforce max size
    if (this.deadLetterQueue.length >= this.config.deadLetterQueueMaxSize) {
      this.deadLetterQueue.shift(); // Remove oldest
    }

    this.deadLetterQueue.push(event);

    // Update event store if enabled
    if (this.config.enablePersistence && this.eventStore) {
      this.eventStore.addToDeadLetterQueue(event, metadata);
    }
  }

  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(): DomainEvent[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Retry events from dead letter queue
   */
  async retryDeadLetterQueue(): Promise<void> {
    const events = [...this.deadLetterQueue];
    this.deadLetterQueue = [];

    for (const event of events) {
      const metadata: EventMetadata = {
        id: `${event.getEventName()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventName: event.getEventName(),
        publishedAt: new Date(),
        status: 'pending',
        retryCount: 0,
      };

      await this.publish(event);
    }
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
    this.processingQueue.clear();
    this.deadLetterQueue = [];
  }

  /**
   * Get event statistics
   */
  getStats(): {
    handlersCount: number;
    processingCount: number;
    deadLetterQueueSize: number;
    redisConnected: boolean;
  } {
    return {
      handlersCount: Array.from(this.handlers.values()).reduce((sum, handlers) => sum + handlers.length, 0),
      processingCount: this.processingQueue.size,
      deadLetterQueueSize: this.deadLetterQueue.length,
      redisConnected: this.redisConnected,
    };
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.redisClient && this.redisConnected) {
      await this.redisClient.quit();
      this.redisConnected = false;
    }
  }
}

// Singleton async event bus instance
let asyncEventBusInstance: AsyncEventBus | null = null;

export function getAsyncEventBus(eventStore?: IEventStore): AsyncEventBus {
  if (!asyncEventBusInstance) {
    asyncEventBusInstance = new AsyncEventBus({}, eventStore);
  }
  return asyncEventBusInstance;
}

export function resetAsyncEventBus(): void {
  asyncEventBusInstance = null;
}
