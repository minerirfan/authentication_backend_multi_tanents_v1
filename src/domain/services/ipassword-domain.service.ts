import { Password } from '../value-objects/password';

export interface IPasswordDomainService {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
}

