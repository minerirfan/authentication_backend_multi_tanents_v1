import { IPasswordDomainService } from './ipassword-domain.service';
import { IPasswordHasher } from './ipassword-hasher';

export class PasswordDomainService implements IPasswordDomainService {
  constructor(private passwordHasher: IPasswordHasher) {}

  async hashPassword(password: string): Promise<string> {
    return this.passwordHasher.hash(password);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return this.passwordHasher.compare(password, hashedPassword);
  }
}

