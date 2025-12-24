import bcrypt from 'bcrypt';
import { IPasswordHasher } from '../../domain/services/ipassword-hasher';

export class PasswordService implements IPasswordHasher {
  private static readonly SALT_ROUNDS = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, PasswordService.SALT_ROUNDS);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}

