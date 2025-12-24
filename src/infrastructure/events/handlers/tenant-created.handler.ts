import { TenantCreatedEvent } from '../../../domain/events/tenant-created.event';
import { EventHandler } from '../event-handler';

/**
 * Handler for TenantCreatedEvent
 * Can be extended to add logging, notifications, etc.
 */
export class TenantCreatedHandler extends EventHandler<TenantCreatedEvent> {
  async handle(event: TenantCreatedEvent): Promise<void> {
    // Log the event (in production, you might want to use a proper logging service)
    console.log(`[TenantCreatedEvent] Tenant ${event.tenantId} (${event.tenantName}) created with slug ${event.tenantSlug}`);
    
    // Future: Add audit logging, send notifications, etc.
  }
}

