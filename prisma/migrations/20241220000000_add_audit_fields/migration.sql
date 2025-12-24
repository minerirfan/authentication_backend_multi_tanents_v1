-- Add audit fields to all tables
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_by" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_by" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "created_by" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "updated_by" TEXT;
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "created_by" TEXT;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "updated_by" TEXT;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "created_by" TEXT;
ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "updated_by" TEXT;
ALTER TABLE "permissions" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Add proper indexes for performance
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_tenant_id" ON "users"("tenantId");
CREATE INDEX IF NOT EXISTS "idx_users_deleted_at" ON "users"("deleted_at");

CREATE INDEX IF NOT EXISTS "idx_tenants_slug" ON "tenants"("slug");
CREATE INDEX IF NOT EXISTS "idx_tenants_deleted_at" ON "tenants"("deleted_at");

CREATE INDEX IF NOT EXISTS "idx_roles_tenant_id" ON "roles"("tenantId");
CREATE INDEX IF NOT EXISTS "idx_roles_deleted_at" ON "roles"("deleted_at");

CREATE INDEX IF NOT EXISTS "idx_permissions_tenant_id" ON "permissions"("tenantId");
CREATE INDEX IF NOT EXISTS "idx_permissions_deleted_at" ON "permissions"("deleted_at");

-- Add password reset tokens table
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "password_reset_tokens_token_key" ON "password_reset_tokens"("token");
CREATE INDEX IF NOT EXISTS "idx_password_reset_tokens_user_id" ON "password_reset_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "idx_password_reset_tokens_expires_at" ON "password_reset_tokens"("expires_at");

-- Add foreign key constraint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;