import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { ITenantRepository } from '../../../domain/repositories/itenant-repository';
import { ITokenRepository } from '../../../domain/repositories/itoken-repository';
import { IUserRoleRepository } from '../../../domain/repositories/iuser-role-repository';
import { IPasswordDomainService } from '../../../domain/services/ipassword-domain.service';
import { JwtService } from '../../../infrastructure/external/jwt.service';
import { UnauthorizedException, NotFoundException } from '../../../domain/exceptions/domain-exceptions';
import { LoginDto, AuthResponseDto } from '../../dto/auth.dto';

export class LoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private tenantRepository: ITenantRepository,
    private tokenRepository: ITokenRepository,
    private userRoleRepository: IUserRoleRepository,
    private passwordDomainService: IPasswordDomainService
  ) { }

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    // Find tenant if slug provided
    let tenantId: string | null = null;
    if (dto.tenantSlug) {
      const tenant = await this.tenantRepository.findBySlug(dto.tenantSlug);
      if (!tenant) {
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
      // Get all users with this email (no tenant filter)
      const allUsersResult = await this.userRoleRepository.getUsersWithRoles(null, { page: 1, limit: 100 });
      const usersWithEmail = allUsersResult.data.filter(u => u.email === dto.email);

      if (usersWithEmail.length === 0) {
        throw new UnauthorizedException('Invalid credentials');
      }
      if (usersWithEmail.length > 1) {
        throw new UnauthorizedException('Multiple tenants found. Please specify tenant slug.');
      }
      user = await this.userRepository.findByEmail(dto.email, usersWithEmail[0].tenantId || null);
      tenantId = usersWithEmail[0].tenantId;
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
      throw new UnauthorizedException('Invalid credentials');
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

