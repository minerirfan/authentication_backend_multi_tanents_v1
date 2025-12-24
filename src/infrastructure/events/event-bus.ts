import { DomainEvent } from '../../domain/events/domain-event';

/**
 * Type for event handler functions
 */
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => Promise<void> | void;

/**
 * Simple in-memory event bus for domain events
 */
export class EventBus {
  private handlers = new Map<string, EventHandler[]>();

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
   * Publish an event to all subscribed handlers
   * @param event - The domain event to publish
   */
  async publish(event: DomainEvent): Promise<void> {
    const eventName = event.getEventName();
    const handlers = this.handlers.get(eventName) || [];

    // Execute all handlers (fire and forget - errors are logged but don't stop execution)
    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error handling event ${eventName}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear();
  }
}

// Singleton event bus instance
export const eventBus = new EventBus();

