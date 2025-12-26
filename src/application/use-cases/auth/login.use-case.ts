import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { ITenantRepository } from '../../../domain/repositories/itenant-repository';
import { ITokenRepository } from '../../../domain/repositories/itoken-repository';
import { IUserRoleRepository } from '../../../domain/repositories/iuser-role-repository';
import { IPasswordDomainService } from '../../../domain/services/ipassword-domain.service';
import { JwtService } from '../../../infrastructure/external/jwt.service';
import { UnauthorizedException, NotFoundException } from '../../../domain/exceptions/domain-exceptions';
import { LoginDto, AuthResponseDto } from '../../dto/auth.dto';
import { Logger } from '../../../infrastructure/logging/logger';

export class LoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private tenantRepository: ITenantRepository,
    private tokenRepository: ITokenRepository,
    private userRoleRepository: IUserRoleRepository,
    private passwordDomainService: IPasswordDomainService
  ) { }

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    Logger.info('User login attempt', { email: dto.email });
    
    // Find tenant if slug provided
    let tenantId: string | null = null;
    if (dto.tenantSlug) {
      const tenant = await this.tenantRepository.findBySlug(dto.tenantSlug);
      if (!tenant) {
        Logger.warn('Tenant not found', { tenantSlug: dto.tenantSlug });
        throw new NotFoundException('Tenant', dto.tenantSlug);
      }
      tenantId = tenant.id;
    }

    // Find user by email (and tenant if provided)
    let user;
    if (tenantId) {
      user = await this.userRepository.findByEmail(dto.email, tenantId);
    } else {
      // Try to find user across all tenants (for initial login)
      // Use efficient single query instead of N+1 pattern
      const minimalUser = await this.userRepository.findByEmailOnly(dto.email);

      if (!minimalUser) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check if user exists in multiple tenants
      const allUsersResult = await this.userRoleRepository.getUsersWithRoles(null, { page: 1, limit: 100 });
      const usersWithEmail = allUsersResult.data.filter(u => u.email === dto.email);

      if (usersWithEmail.length > 1) {
        throw new UnauthorizedException('Multiple tenants found. Please specify tenant slug.');
      }

      // Fetch full user with password
      user = await this.userRepository.findByEmail(dto.email, minimalUser.tenantId);
      tenantId = minimalUser.tenantId;
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValid = await this.passwordDomainService.comparePassword(
      dto.password,
      user.getPassword().getValue()
    );

    if (!isValid) {
      Logger.warn('Invalid password attempt', { email: dto.email });
      throw new UnauthorizedException('Invalid credentials');
    }

    Logger.info('User authenticated successfully', { userId: user.id, email: user.email.getValue() });

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

    // Generate tokens
    const jwtPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email.getValue(),
      roles,
      permissions,
      isSuperAdmin: user.isSuperAdmin,
    };

    const accessToken = JwtService.generateAccessToken(jwtPayload);
    const refreshToken = JwtService.generateRefreshToken(jwtPayload);

    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await this.tokenRepository.save(refreshToken, user.id, expiresAt);
    
    Logger.info('Tokens generated successfully', { userId: user.id });

    return {
      accessToken,
      refreshToken,
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

