import { DomainEvent } from '../../domain/events/domain-event';
import { EventMetadata } from './async-event-bus';

/**
 * Interface for event persistence
 * Allows storing events in database, Redis, or other storage
 */
export interface IEventStore {
  /**
   * Save an event with its metadata
   */
  saveEvent(event: DomainEvent, metadata: EventMetadata): Promise<void>;

  /**
   * Update event metadata
   */
  updateEventMetadata(eventId: string, metadata: EventMetadata): Promise<void>;

  /**
   * Get event by ID
   */
  getEvent(eventId: string): Promise<{ event: DomainEvent; metadata: EventMetadata } | null>;

  /**
   * Get events by name
   */
  getEventsByName(eventName: string, limit?: number): Promise<Array<{ event: DomainEvent; metadata: EventMetadata }>>;

  /**
   * Get failed events
   */
  getFailedEvents(limit?: number): Promise<Array<{ event: DomainEvent; metadata: EventMetadata }>>;

  /**
   * Get pending events
   */
  getPendingEvents(limit?: number): Promise<Array<{ event: DomainEvent; metadata: EventMetadata }>>;

  /**
   * Add event to dead letter queue
   */
  addToDeadLetterQueue(event: DomainEvent, metadata: EventMetadata): Promise<void>;

  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(): Promise<Array<{ event: DomainEvent; metadata: EventMetadata }>>;

  /**
   * Clear old events
   */
  clearOldEvents(olderThan: Date): Promise<number>;

  /**
   * Get event statistics
   */
  getStats(): Promise<{
    totalEvents: number;
    pendingEvents: number;
    processingEvents: number;
    completedEvents: number;
    failedEvents: number;
    deadLetterQueueSize: number;
  }>;
}
