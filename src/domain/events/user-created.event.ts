import { DomainEvent } from './domain-event';

/**
 * Event emitted when a user is created
 */
export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly tenantId: string | null,
    public readonly isSuperAdmin: boolean,
    eventId?: string
  ) {
    super(eventId);
  }

  getEventName(): string {
    return 'UserCreated';
  }
}

