// Manual Dependency Injection Container
// Simple, type-safe DI container without external dependencies

type Constructor<T = {}> = new (...args: any[]) => T;
type Factory<T> = () => T;

interface Binding<T> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
}

class DIContainer {
  private bindings = new Map<string, Binding<any>>();

  /**
   * Bind a type to a factory function
   * @param key - Unique identifier for the binding
   * @param factory - Factory function that creates the instance
   * @param singleton - Whether to create a singleton instance (default: true)
   */
  bind<T>(key: string, factory: Factory<T>, singleton: boolean = true): void {
    this.bindings.set(key, { factory, singleton });
  }

  /**
   * Bind a class constructor
   * @param key - Unique identifier for the binding
   * @param constructor - Class constructor
   * @param singleton - Whether to create a singleton instance (default: true)
   */
  bindClass<T>(key: string, constructor: Constructor<T>, singleton: boolean = true): void {
    this.bind(key, () => new constructor(), singleton);
  }

  /**
   * Get an instance of the bound type
   * @param key - Unique identifier for the binding
   * @returns Instance of the bound type
   */
  get<T>(key: string): T {
    const binding = this.bindings.get(key);
    if (!binding) {
      throw new Error(`No binding found for key: ${key}`);
    }

    if (binding.singleton) {
      if (!binding.instance) {
        binding.instance = binding.factory();
      }
      return binding.instance;
    }

    return binding.factory();
  }

  /**
   * Check if a key is bound
   */
  has(key: string): boolean {
    return this.bindings.has(key);
  }

  /**
   * Clear all bindings (useful for testing)
   */
  clear(): void {
    this.bindings.clear();
  }
}

// Create singleton container instance
export const container = new DIContainer();

// This function will be called after all imports are resolved
// Controllers should call this during initialization
export function initializeContainer(): void {
  // Repositories - imported here to avoid circular dependencies
  const { UserRepository } = require('../persistence/user.repository');
  const { RoleRepository } = require('../persistence/role.repository');
  const { TenantRepository } = require('../persistence/tenant.repository');
  const { PermissionRepository } = require('../persistence/permission.repository');
  const { TokenRepository } = require('../persistence/token.repository');
  const { UserRoleRepository } = require('../persistence/user-role.repository');
  const { SystemConfigRepository } = require('../persistence/system-config.repository');
  const { UserProfileRepository } = require('../persistence/user-profile.repository');
  const { getCacheInstance } = require('../cache/redis-cache.repository');

  // Services
  const { PasswordService } = require('../external/password.service');
  const { JwtService } = require('../external/jwt.service');
  
  // Domain Services
  const { AdminLimitService } = require('../../domain/services/admin-limit.service');
  const { PasswordDomainService } = require('../../domain/services/password-domain.service');
  const { TenantSetupService } = require('../../domain/services/tenant-setup.service');

  // Use Cases - Auth
  const { OnboardUseCase } = require('../../application/use-cases/auth/onboard.use-case');
  const { RegisterUseCase } = require('../../application/use-cases/auth/register.use-case');
  const { LoginUseCase } = require('../../application/use-cases/auth/login.use-case');
  const { RefreshTokenUseCase } = require('../../application/use-cases/auth/refresh-token.use-case');
  const { LogoutUseCase } = require('../../application/use-cases/auth/logout.use-case');
  const { ValidateTokenUseCase } = require('../../application/use-cases/auth/validate-token.use-case');
  const { ForgotPasswordUseCase } = require('../../application/use-cases/auth/forgot-password.use-case');
  const { ResetPasswordUseCase } = require('../../application/use-cases/auth/reset-password.use-case');
  
  // Use Cases - User
  const { CreateUserUseCase } = require('../../application/use-cases/user/create-user.use-case');
  const { GetUsersUseCase } = require('../../application/use-cases/user/get-users.use-case');
  const { GetUserUseCase } = require('../../application/use-cases/user/get-user.use-case');
  const { UpdateUserUseCase } = require('../../application/use-cases/user/update-user.use-case');
  const { DeleteUserUseCase } = require('../../application/use-cases/user/delete-user.use-case');
  
  // Use Cases - Role
  const { CreateRoleUseCase } = require('../../application/use-cases/role/create-role.use-case');
  const { GetRolesUseCase } = require('../../application/use-cases/role/get-roles.use-case');
  const { GetRoleUseCase } = require('../../application/use-cases/role/get-role.use-case');
  const { UpdateRoleUseCase } = require('../../application/use-cases/role/update-role.use-case');
  const { DeleteRoleUseCase } = require('../../application/use-cases/role/delete-role.use-case');
  const { CreateRoleForTenantUseCase } = require('../../application/use-cases/role/create-role-for-tenant.use-case');
  
  // Use Cases - Tenant
  const { CreateTenantUseCase } = require('../../application/use-cases/tenant/create-tenant.use-case');
  const { GetTenantsUseCase } = require('../../application/use-cases/tenant/get-tenants.use-case');
  const { UpdateTenantUseCase } = require('../../application/use-cases/tenant/update-tenant.use-case');
  const { DeleteTenantUseCase } = require('../../application/use-cases/tenant/delete-tenant.use-case');
  
  // Use Cases - Permission
  const { CreatePermissionUseCase } = require('../../application/use-cases/permission/create-permission.use-case');
  const { GetPermissionsUseCase } = require('../../application/use-cases/permission/get-permissions.use-case');
  
  // Use Cases - User Profile
  const { CreateUserProfileUseCase } = require('../../application/use-cases/user-profile/create-user-profile.use-case');
  const { UpdateUserProfileUseCase } = require('../../application/use-cases/user-profile/update-user-profile.use-case');
  const { GetUserProfileUseCase } = require('../../application/use-cases/user-profile/get-user-profile.use-case');

  // Get cache instance
  const cacheInstance = getCacheInstance();

  // Register Repositories (singletons with cache injection)
  container.bind('IUserRepository', () => {
    return new UserRepository(cacheInstance);
  });
  container.bind('IRoleRepository', () => {
    return new RoleRepository(cacheInstance);
  });
  container.bindClass('ITenantRepository', TenantRepository);
  container.bindClass('IPermissionRepository', PermissionRepository);
  container.bind('ITokenRepository', () => {
    return new TokenRepository(cacheInstance);
  });
  container.bindClass('IUserRoleRepository', UserRoleRepository);
  container.bindClass('ISystemConfigRepository', SystemConfigRepository);
  container.bindClass('IUserProfileRepository', UserProfileRepository);
  container.bind('ICacheRepository', () => cacheInstance, true);

  // Register Services
  container.bind('JwtService', () => JwtService, false);
  
  // Register IPasswordHasher (infrastructure implementation)
  container.bind('IPasswordHasher', () => new PasswordService(), true);
  
  // Register Domain Services
  container.bindClass('AdminLimitService', AdminLimitService);
  container.bind('PasswordDomainService', () => {
    return new PasswordDomainService(container.get('IPasswordHasher'));
  });
  container.bind('TenantSetupService', () => {
    return new TenantSetupService(container.get('IPermissionRepository'));
  });

  // Register Use Cases - Auth
  container.bind('OnboardUseCase', () => {
    return new OnboardUseCase(
      container.get('IUserRepository'),
      container.get('ITenantRepository'),
      container.get('IRoleRepository'),
      container.get('IPermissionRepository'),
      container.get('ISystemConfigRepository'),
      container.get('PasswordDomainService')
    );
  });

  container.bind('RegisterUseCase', () => {
    return new RegisterUseCase(
      container.get('IUserRepository'),
      container.get('ITenantRepository'),
      container.get('IRoleRepository'),
      container.get('IUserRoleRepository'),
      container.get('IPermissionRepository'),
      container.get('ISystemConfigRepository'),
      container.get('AdminLimitService'),
      container.get('PasswordDomainService'),
      container.get('TenantSetupService')
    );
  });

  container.bind('LoginUseCase', () => {
    return new LoginUseCase(
      container.get('IUserRepository'),
      container.get('ITenantRepository'),
      container.get('ITokenRepository'),
      container.get('IUserRoleRepository'),
      container.get('PasswordDomainService')
    );
  });

  container.bind('RefreshTokenUseCase', () => {
    return new RefreshTokenUseCase(
      container.get('ITokenRepository'),
      container.get('IUserRepository'),
      container.get('IUserRoleRepository')
    );
  });

  container.bind('LogoutUseCase', () => {
    return new LogoutUseCase(container.get('ITokenRepository'));
  });

  container.bind('ValidateTokenUseCase', () => {
    return new ValidateTokenUseCase(
      container.get('IUserRepository'),
      container.get('IUserRoleRepository')
    );
  });

  container.bind('ForgotPasswordUseCase', () => {
    return new ForgotPasswordUseCase(
      container.get('IUserRepository'),
      container.get('ITenantRepository'),
      container.get('ITokenRepository')
    );
  });

  container.bind('ResetPasswordUseCase', () => {
    return new ResetPasswordUseCase(
      container.get('IUserRepository'),
      container.get('ITokenRepository'),
      container.get('IPasswordHasher')
    );
  });

  // Register Use Cases - User
  container.bind('CreateUserUseCase', () => {
    return new CreateUserUseCase(
      container.get('IUserRepository'),
      container.get('IRoleRepository'),
      container.get('IUserRoleRepository'),
      container.get('AdminLimitService'),
      container.get('PasswordDomainService')
    );
  });

  container.bind('GetUsersUseCase', () => {
    return new GetUsersUseCase(
      container.get('IUserRepository'),
      container.get('IUserRoleRepository')
    );
  });

  container.bind('GetUserUseCase', () => {
    return new GetUserUseCase(
      container.get('IUserRepository'),
      container.get('IUserRoleRepository')
    );
  });

  container.bind('UpdateUserUseCase', () => {
    return new UpdateUserUseCase(
      container.get('IUserRepository'),
      container.get('IRoleRepository'),
      container.get('IUserRoleRepository'),
      container.get('AdminLimitService'),
      container.get('PasswordDomainService')
    );
  });

  container.bind('DeleteUserUseCase', () => {
    return new DeleteUserUseCase(
      container.get('IUserRepository'),
      container.get('IUserRoleRepository'),
      container.get('AdminLimitService')
    );
  });

  // Register Use Cases - Role
  container.bind('CreateRoleUseCase', () => {
    return new CreateRoleUseCase(
      container.get('IRoleRepository'),
      container.get('IPermissionRepository')
    );
  });

  container.bind('GetRolesUseCase', () => {
    return new GetRolesUseCase(container.get('IRoleRepository'));
  });

  container.bind('GetRoleUseCase', () => {
    return new GetRoleUseCase(container.get('IRoleRepository'));
  });

  container.bind('UpdateRoleUseCase', () => {
    return new UpdateRoleUseCase(
      container.get('IRoleRepository'),
      container.get('IPermissionRepository')
    );
  });

  container.bind('DeleteRoleUseCase', () => {
    return new DeleteRoleUseCase(container.get('IRoleRepository'));
  });

  container.bind('CreateRoleForTenantUseCase', () => {
    return new CreateRoleForTenantUseCase(
      container.get('IRoleRepository'),
      container.get('IPermissionRepository')
    );
  });

  // Register Use Cases - Tenant
  container.bind('CreateTenantUseCase', () => {
    return new CreateTenantUseCase(
      container.get('ITenantRepository'),
      container.get('IRoleRepository'),
      container.get('IUserRepository'),
      container.get('IUserRoleRepository'),
      container.get('IPermissionRepository'),
      container.get('PasswordDomainService'),
      container.get('TenantSetupService')
    );
  });

  container.bind('GetTenantsUseCase', () => {
    return new GetTenantsUseCase(container.get('ITenantRepository'));
  });

  container.bind('UpdateTenantUseCase', () => {
    return new UpdateTenantUseCase(container.get('ITenantRepository'));
  });

  container.bind('DeleteTenantUseCase', () => {
    return new DeleteTenantUseCase(container.get('ITenantRepository'));
  });

  // Register Use Cases - Permission
  const { UpdatePermissionUseCase } = require('../../application/use-cases/permission/update-permission.use-case');
  const { DeletePermissionUseCase } = require('../../application/use-cases/permission/delete-permission.use-case');

  container.bind('CreatePermissionUseCase', () => {
    return new CreatePermissionUseCase(container.get('IPermissionRepository'));
  });

  container.bind('GetPermissionsUseCase', () => {
    return new GetPermissionsUseCase(container.get('IPermissionRepository'));
  });

  container.bind('UpdatePermissionUseCase', () => {
    return new UpdatePermissionUseCase(container.get('IPermissionRepository'));
  });

  container.bind('DeletePermissionUseCase', () => {
    return new DeletePermissionUseCase(container.get('IPermissionRepository'));
  });

  // Register Use Cases - User Profile
  container.bind('CreateUserProfileUseCase', () => {
    return new CreateUserProfileUseCase(
      container.get('IUserProfileRepository'),
      container.get('IUserRepository')
    );
  });

  container.bind('UpdateUserProfileUseCase', () => {
    return new UpdateUserProfileUseCase(
      container.get('IUserProfileRepository'),
      container.get('IUserRepository')
    );
  });

  container.bind('GetUserProfileUseCase', () => {
    return new GetUserProfileUseCase(
      container.get('IUserProfileRepository'),
      container.get('IUserRepository')
    );
  });
}
