import { DomainEvent } from '../../domain/events/domain-event';
import { IEventStore } from './ievent-store';
import { EventMetadata } from './async-event-bus';
import { createClient, RedisClientType } from 'redis';

/**
 * Redis-based event store implementation
 * Stores events in Redis with TTL for automatic cleanup
 */
export class RedisEventStore implements IEventStore {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private readonly EVENT_PREFIX = 'event:';
  private readonly METADATA_PREFIX = 'event:metadata:';
  private readonly DLQ_PREFIX = 'event:dlq:';
  private readonly INDEX_PREFIX = 'event:index:';
  private readonly DEFAULT_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor() {
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = createClient({ url: redisUrl });

      this.client.on('error', (err) => {
        console.error('Redis Event Store Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis Event Store Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis Event Store Disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis event store:', error);
      this.isConnected = false;
    }
  }

  async saveEvent(event: DomainEvent, metadata: EventMetadata): Promise<void> {
    if (!this.client || !this.isConnected) {
      console.warn('Redis not connected, event not persisted');
      return;
    }

    try {
      const eventKey = `${this.EVENT_PREFIX}${metadata.id}`;
      const metadataKey = `${this.METADATA_PREFIX}${metadata.id}`;
      const indexKey = `${this.INDEX_PREFIX}${metadata.eventName}`;
      const statusKey = `${this.INDEX_PREFIX}status:${metadata.status}`;

      // Serialize event
      const eventData = JSON.stringify({
        eventName: event.getEventName(),
        occurredOn: event.occurredOn,
        data: event,
      });

      // Serialize metadata
      const metadataData = JSON.stringify(metadata);

      // Save event and metadata with TTL
      await this.client.multi()
        .set(eventKey, eventData, { EX: this.DEFAULT_TTL })
        .set(metadataKey, metadataData, { EX: this.DEFAULT_TTL })
        .lPush(indexKey, metadata.id)
        .expire(indexKey, this.DEFAULT_TTL)
        .lPush(statusKey, metadata.id)
        .expire(statusKey, this.DEFAULT_TTL)
        .exec();
    } catch (error) {
      console.error(`Failed to save event ${metadata.id}:`, error);
    }
  }

  async updateEventMetadata(eventId: string, metadata: EventMetadata): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      const metadataKey = `${this.METADATA_PREFIX}${eventId}`;
      const oldMetadataData = await this.client.get(metadataKey);

      if (oldMetadataData) {
        const oldMetadata = JSON.parse(oldMetadataData) as EventMetadata;
        const oldStatusKey = `${this.INDEX_PREFIX}status:${oldMetadata.status}`;
        const newStatusKey = `${this.INDEX_PREFIX}status:${metadata.status}`;

        // Update metadata
        const metadataData = JSON.stringify(metadata);
        await this.client.set(metadataKey, metadataData, { EX: this.DEFAULT_TTL });

        // Update status index if changed
        if (oldMetadata.status !== metadata.status) {
          await this.client.multi()
            .lRem(oldStatusKey, 0, eventId)
            .lPush(newStatusKey, eventId)
            .expire(newStatusKey, this.DEFAULT_TTL)
            .exec();
        }
      }
    } catch (error) {
      console.error(`Failed to update event metadata ${eventId}:`, error);
    }
  }

  async getEvent(eventId: string): Promise<{ event: DomainEvent; metadata: EventMetadata } | null> {
    if (!this.client || !this.isConnected) {
      return null;
    }

    try {
      const eventKey = `${this.EVENT_PREFIX}${eventId}`;
      const metadataKey = `${this.METADATA_PREFIX}${eventId}`;

      const [eventData, metadataData] = await this.client.multi()
        .get(eventKey)
        .get(metadataKey)
        .exec();

      if (!eventData?.response || !metadataData?.response) {
        return null;
      }

      const event = JSON.parse(eventData.response as string) as DomainEvent;
      const metadata = JSON.parse(metadataData.response as string) as EventMetadata;

      return { event, metadata };
    } catch (error) {
      console.error(`Failed to get event ${eventId}:`, error);
      return null;
    }
  }

  async getEventsByName(eventName: string, limit = 100): Promise<Array<{ event: DomainEvent; metadata: EventMetadata }>> {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      const indexKey = `${this.INDEX_PREFIX}${eventName}`;
      const eventIds = await this.client.lRange(indexKey, 0, limit - 1);

      if (!eventIds || eventIds.length === 0) {
        return [];
      }

      const events = await Promise.all(
        eventIds.map(async (eventId) => this.getEvent(eventId))
      );

      return events.filter((e): e is { event: DomainEvent; metadata: EventMetadata } => e !== null);
    } catch (error) {
      console.error(`Failed to get events by name ${eventName}:`, error);
      return [];
    }
  }

  async getFailedEvents(limit = 100): Promise<Array<{ event: DomainEvent; metadata: EventMetadata }>> {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      const statusKey = `${this.INDEX_PREFIX}status:failed`;
      const eventIds = await this.client.lRange(statusKey, 0, limit - 1);

      if (!eventIds || eventIds.length === 0) {
        return [];
      }

      const events = await Promise.all(
        eventIds.map(async (eventId) => this.getEvent(eventId))
      );

      return events.filter((e): e is { event: DomainEvent; metadata: EventMetadata } => e !== null);
    } catch (error) {
      console.error('Failed to get failed events:', error);
      return [];
    }
  }

  async getPendingEvents(limit = 100): Promise<Array<{ event: DomainEvent; metadata: EventMetadata }>> {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      const statusKey = `${this.INDEX_PREFIX}status:pending`;
      const eventIds = await this.client.lRange(statusKey, 0, limit - 1);

      if (!eventIds || eventIds.length === 0) {
        return [];
      }

      const events = await Promise.all(
        eventIds.map(async (eventId) => this.getEvent(eventId))
      );

      return events.filter((e): e is { event: DomainEvent; metadata: EventMetadata } => e !== null);
    } catch (error) {
      console.error('Failed to get pending events:', error);
      return [];
    }
  }

  async addToDeadLetterQueue(event: DomainEvent, metadata: EventMetadata): Promise<void> {
    if (!this.client || !this.isConnected) {
      return;
    }

    try {
      const dlqKey = `${this.DLQ_PREFIX}${metadata.id}`;

      // Save event to DLQ with longer TTL
      const eventData = JSON.stringify({
        eventName: event.getEventName(),
        occurredOn: event.occurredOn,
        data: event,
      });

      const metadataData = JSON.stringify(metadata);

      await this.client.multi()
        .set(dlqKey, JSON.stringify({ event: eventData, metadata: metadataData }), { EX: this.DEFAULT_TTL * 2 })
        .lPush('event:dlq:all', metadata.id)
        .expire('event:dlq:all', this.DEFAULT_TTL * 2)
        .exec();
    } catch (error) {
      console.error(`Failed to add event ${metadata.id} to DLQ:`, error);
    }
  }

  async getDeadLetterQueue(): Promise<Array<{ event: DomainEvent; metadata: EventMetadata }>> {
    if (!this.client || !this.isConnected) {
      return [];
    }

    try {
      const dlqKey = 'event:dlq:all';
      const eventIds = await this.client.lRange(dlqKey, 0, -1);

      if (!eventIds || eventIds.length === 0) {
        return [];
      }

      const events = await Promise.all(
        eventIds.map(async (eventId) => {
          const dlqKey = `${this.DLQ_PREFIX}${eventId}`;
          const data = await this.client.get(dlqKey);

          if (!data) {
            return null;
          }

          const parsed = JSON.parse(data);
          return {
            event: JSON.parse(parsed.event) as DomainEvent,
            metadata: JSON.parse(parsed.metadata) as EventMetadata,
          };
        })
      );

      return events.filter((e): e is { event: DomainEvent; metadata: EventMetadata } => e !== null);
    } catch (error) {
      console.error('Failed to get dead letter queue:', error);
      return [];
    }
  }

  async clearOldEvents(olderThan: Date): Promise<number> {
    if (!this.client || !this.isConnected) {
      return 0;
    }

    try {
      // Get all event IDs
      const keys = await this.client.keys(`${this.METADATA_PREFIX}*`);
      let cleared = 0;

      for (const key of keys) {
        const eventId = key.replace(this.METADATA_PREFIX, '');
        const event = await this.getEvent(eventId);

        if (event && event.metadata.publishedAt < olderThan) {
          await this.client.multi()
            .del(`${this.EVENT_PREFIX}${eventId}`)
            .del(`${this.METADATA_PREFIX}${eventId}`)
            .lRem(`${this.INDEX_PREFIX}${event.metadata.eventName}`, 0, eventId)
            .lRem(`${this.INDEX_PREFIX}status:${event.metadata.status}`, 0, eventId)
            .exec();

          cleared++;
        }
      }

      return cleared;
    } catch (error) {
      console.error('Failed to clear old events:', error);
      return 0;
    }
  }

  async getStats(): Promise<{
    totalEvents: number;
    pendingEvents: number;
    processingEvents: number;
    completedEvents: number;
    failedEvents: number;
    deadLetterQueueSize: number;
  }> {
    if (!this.client || !this.isConnected) {
      return {
        totalEvents: 0,
        pendingEvents: 0,
        processingEvents: 0,
        completedEvents: 0,
        failedEvents: 0,
        deadLetterQueueSize: 0,
      };
    }

    try {
      const [pending, processing, completed, failed, dlq] = await Promise.all([
        this.client.lLen(`${this.INDEX_PREFIX}status:pending`),
        this.client.lLen(`${this.INDEX_PREFIX}status:processing`),
        this.client.lLen(`${this.INDEX_PREFIX}status:completed`),
        this.client.lLen(`${this.INDEX_PREFIX}status:failed`),
        this.client.lLen('event:dlq:all'),
      ]);

      return {
        totalEvents: (pending || 0) + (processing || 0) + (completed || 0) + (failed || 0),
        pendingEvents: pending || 0,
        processingEvents: processing || 0,
        completedEvents: completed || 0,
        failedEvents: failed || 0,
        deadLetterQueueSize: dlq || 0,
      };
    } catch (error) {
      console.error('Failed to get event stats:', error);
      return {
        totalEvents: 0,
        pendingEvents: 0,
        processingEvents: 0,
        completedEvents: 0,
        failedEvents: 0,
        deadLetterQueueSize: 0,
      };
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

// Singleton instance
let eventStoreInstance: RedisEventStore | null = null;

export function getEventStore(): RedisEventStore {
  if (!eventStoreInstance) {
    eventStoreInstance = new RedisEventStore();
  }
  return eventStoreInstance;
}

export function resetEventStore(): void {
  eventStoreInstance = null;
}
