import { UserCreatedEvent } from '../../../domain/events/user-created.event';
import { EventHandler } from '../event-handler';

/**
 * Handler for UserCreatedEvent
 * Can be extended to add logging, notifications, etc.
 */
export class UserCreatedHandler extends EventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    // Log the event (in production, you might want to use a proper logging service)
    console.log(`[UserCreatedEvent] User ${event.userId} created for tenant ${event.tenantId || 'N/A'}`);
    
    // Future: Add audit logging, send notifications, etc.
  }
}

