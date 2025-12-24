-- Add audit fields to all tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR(36);
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36);
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS created_by VARCHAR(36);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_by VARCHAR(36);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36);
ALTER TABLE roles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

ALTER TABLE permissions ADD COLUMN IF NOT EXISTS created_by VARCHAR(36);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS updated_by VARCHAR(36);
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- Add proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_deleted_at ON tenants(deleted_at);

CREATE INDEX IF NOT EXISTS idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_name_tenant ON roles(name, tenant_id);
CREATE INDEX IF NOT EXISTS idx_roles_deleted_at ON roles(deleted_at);

CREATE INDEX IF NOT EXISTS idx_permissions_tenant_id ON permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_permissions_deleted_at ON permissions(deleted_at);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- Add password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);