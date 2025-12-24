/**
 * Base class for all domain events
 * Domain events represent something important that happened in the domain
 */
export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;

  constructor(eventId?: string) {
    this.eventId = eventId || this.generateEventId();
    this.occurredAt = new Date();
  }

  private generateEventId(): string {
    return `${this.constructor.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  abstract getEventName(): string;
}

