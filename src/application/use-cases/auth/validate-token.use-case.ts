import { JwtService } from '../../../infrastructure/external/jwt.service';
import { IUserRepository } from '../../../domain/repositories/iuser-repository';
import { IUserRoleRepository } from '../../../domain/repositories/iuser-role-repository';
import { UnauthorizedException, NotFoundException } from '../../../domain/exceptions/domain-exceptions';
import { JwtPayload } from '../../../shared/types';

export interface ValidateTokenResponse {
  valid: boolean;
  expired?: boolean;
  invalid?: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string | null;
    roles: string[];
    permissions: string[];
    isSuperAdmin: boolean;
  };
  message?: string;
}

export class ValidateTokenUseCase {
  constructor(
    private userRepository: IUserRepository,
    private userRoleRepository: IUserRoleRepository
  ) {}

  async execute(token: string): Promise<ValidateTokenResponse> {
    // Check if token is provided
    if (!token || token.trim() === '') {
      return {
        valid: false,
        invalid: true,
        message: 'Token is required',
      };
    }

    // Try to decode token first (without verification) to check if it's malformed
    const decoded = JwtService.decodeToken(token);
    if (!decoded) {
      return {
        valid: false,
        invalid: true,
        message: 'Token is malformed or invalid',
      };
    }

    // Try to verify token
    let payload: JwtPayload;
    try {
      payload = JwtService.verifyToken(token);
    } catch (error: any) {
      // Check if token is expired
      if (error.name === 'TokenExpiredError' || error.message?.includes('expired')) {
        return {
          valid: false,
          expired: true,
          message: 'Token has expired',
        };
      }

      // Check if token has invalid signature
      if (error.name === 'JsonWebTokenError' || error.message?.includes('signature')) {
        return {
          valid: false,
          invalid: true,
          message: 'Token signature is invalid',
        };
      }

      // Other verification errors
      return {
        valid: false,
        invalid: true,
        message: 'Token verification failed',
      };
    }

    // Token is valid, now check if user still exists
    try {
      const user = await this.userRepository.findById(payload.userId, payload.tenantId);
      if (!user) {
        return {
          valid: false,
          invalid: true,
          message: 'User associated with token no longer exists',
        };
      }

      // Get user roles and permissions
      let roles: string[] = [];
      let permissions: string[] = [];

      if (user.isSuperAdmin) {
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

      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email.getValue(),
          firstName: user.firstName,
          lastName: user.lastName,
          tenantId: user.tenantId,
          roles,
          permissions,
          isSuperAdmin: user.isSuperAdmin,
        },
        message: 'Token is valid',
      };
    } catch (error) {
      return {
        valid: false,
        invalid: true,
        message: 'Failed to verify user associated with token',
      };
    }
  }
}

