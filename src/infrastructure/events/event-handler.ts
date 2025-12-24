import { DomainEvent } from '../../domain/events/domain-event';

/**
 * Base class for event handlers
 */
export abstract class EventHandler<T extends DomainEvent = DomainEvent> {
  abstract handle(event: T): Promise<void> | void;
}

