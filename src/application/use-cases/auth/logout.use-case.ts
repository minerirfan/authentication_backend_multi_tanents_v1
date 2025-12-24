import { ITokenRepository } from '../../../domain/repositories/itoken-repository';
import { RefreshTokenDto } from '../../dto/auth.dto';

export class LogoutUseCase {
  constructor(private tokenRepository: ITokenRepository) {}

  async execute(dto: RefreshTokenDto): Promise<void> {
    await this.tokenRepository.delete(dto.refreshToken);
  }
}

