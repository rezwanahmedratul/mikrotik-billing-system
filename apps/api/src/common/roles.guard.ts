import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, RoleHierarchy } from '@mikrotik-billing/shared';
import { ROLES_KEY } from './decorators.js';
import { AuthenticatedUser } from './auth-user.interface.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user || !user.role) {
      throw new ForbiddenException('Access denied: unassigned role');
    }

    // Platform admin has superuser access across all tenant operations
    if (user.role === UserRole.PLATFORM_ADMIN) {
      return true;
    }

    const hasDirectRole = requiredRoles.includes(user.role);
    if (hasDirectRole) {
      return true;
    }

    // Check if user's role rank is at least as high as any of the required roles
    const userRank = RoleHierarchy[user.role] ?? 0;
    const meetsHierarchy = requiredRoles.some((role) => userRank >= (RoleHierarchy[role] ?? 0));

    if (meetsHierarchy) {
      return true;
    }

    throw new ForbiddenException('Access denied: insufficient permissions for this operation');
  }
}
