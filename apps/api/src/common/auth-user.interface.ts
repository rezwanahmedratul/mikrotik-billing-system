import { UserRole } from '@mikrotik-billing/shared';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  fullName: string;
  tenantId: string;
  role: UserRole;
  isPlatformAdmin?: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
  fullName: string;
  tenantId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
