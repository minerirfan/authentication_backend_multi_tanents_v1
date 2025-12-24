import { DomainEvent } from './domain-event';

/**
 * Event emitted when a tenant is created
 */
export class TenantCreatedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly tenantName: string,
    public readonly tenantSlug: string,
    eventId?: string
  ) {
    super(eventId);
  }

  getEventName(): string {
    return 'TenantCreated';
  }
}

