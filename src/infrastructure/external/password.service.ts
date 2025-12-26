import bcrypt from 'bcrypt';
import { IPasswordHasher } from '../../domain/services/ipassword-hasher';

export class PasswordService implements IPasswordHasher {
  private static readonly MIN_SALT_ROUNDS = 12;

  async hash(password: string): Promise<string> {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    
    // Validate minimum rounds for security
    if (rounds < PasswordService.MIN_SALT_ROUNDS) {
      throw new Error(
        `BCRYPT_ROUNDS must be at least ${PasswordService.MIN_SALT_ROUNDS} for security. Current value: ${rounds}`
      );
    }
    
    return bcrypt.hash(password, rounds);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}

