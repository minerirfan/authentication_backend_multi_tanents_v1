/**
 * DTO for caching user data
 * Stores plain data instead of entity instances for simpler serialization/deserialization
 *
 * SECURITY NOTE: Password is NOT included in cache to prevent exposure
 * if Redis is compromised. Password is always fetched from database.
 */
export interface UserCacheDto {
  id: string;
  email: string; // Plain string, not Email value object
  firstName: string;
  lastName: string;
  tenantId: string | null;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

