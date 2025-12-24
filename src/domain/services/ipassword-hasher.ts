/**
 * Interface for password hashing operations
 * This abstraction allows the domain layer to depend on an interface rather than infrastructure
 */
export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hashedPassword: string): Promise<boolean>;
}

