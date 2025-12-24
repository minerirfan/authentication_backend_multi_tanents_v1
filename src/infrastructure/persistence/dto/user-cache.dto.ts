/**
 * DTO for caching user data
 * Stores plain data instead of entity instances for simpler serialization/deserialization
 */
export interface UserCacheDto {
  id: string;
  email: string; // Plain string, not Email value object
  password: string; // Hashed password as plain string
  firstName: string;
  lastName: string;
  tenantId: string | null;
  isSuperAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

