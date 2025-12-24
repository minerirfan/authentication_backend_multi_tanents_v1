export interface OnboardDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RegisterDto {
  tenantName: string;
  tenantSlug: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string;
    roles: string[];
    permissions: string[];
  };
}

