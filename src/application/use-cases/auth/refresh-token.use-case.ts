import { ITokenRepository } from '../../../domain/repositories/itoken-repository';
import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { IUserRoleRepository } from '../../../domain/repositories/iuser-role-repository';
import { JwtService } from '../../../infrastructure/external/jwt.service';
import { UnauthorizedException, NotFoundException } from '../../../domain/exceptions/domain-exceptions';
import { RefreshTokenDto, AuthResponseDto } from '../../dto/auth.dto';

export class RefreshTokenUseCase {
  constructor(
    private tokenRepository: ITokenRepository,
    private userRepository: IUserRepository,
    private userRoleRepository: IUserRoleRepository
  ) { }

  async execute(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    // Verify refresh token
    let payload;
    try {
      payload = JwtService.verifyToken(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token exists in database
    const tokenData = await this.tokenRepository.findByToken(dto.refreshToken);
    if (!tokenData) {
      throw new UnauthorizedException('Refresh token not found or expired');
    }

    // Get user
    const user = await this.userRepository.findById(payload.userId, payload.tenantId);
    if (!user) {
      throw new NotFoundException('User', payload.userId);
    }

    // Get user roles and permissions
    let roles: string[] = [];
    let permissions: string[] = [];

    if (user.isSuperAdmin) {
      // Super admin has all permissions
      roles = ['super_admin'];
      permissions = ['*']; // Wildcard for all permissions
    } else {
      const userWithRoles = await this.userRoleRepository.getUserWithRoles(user.id);
      if (userWithRoles) {
        roles = userWithRoles.roles.map((r) => r.name);
        permissions = userWithRoles.roles.flatMap((r) =>
          r.permissions.map((p) => p.name)
        );
      }
    }

    // Generate new tokens
    const jwtPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email.getValue(),
      roles,
      permissions,
      isSuperAdmin: user.isSuperAdmin,
    };

    const accessToken = JwtService.generateAccessToken(jwtPayload);
    const newRefreshToken = JwtService.generateRefreshToken(jwtPayload);

    // Delete old refresh token and save new one
    await this.tokenRepository.delete(dto.refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await this.tokenRepository.save(newRefreshToken, user.id, expiresAt);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email.getValue(),
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenantId || '',
        roles,
        permissions,
      },
    };
  }
}

