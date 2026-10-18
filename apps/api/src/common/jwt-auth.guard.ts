import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from './decorators.js';
import { JwtPayload, AuthenticatedUser } from './auth-user.interface.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token is missing or malformed');
    }

    const token = authHeader.substring(7);
    const jwtSecret =
      process.env.JWT_SECRET || 'super_secret_jwt_key_for_development_purposes_only';

    try {
      const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
      const user: AuthenticatedUser = {
        userId: decoded.sub,
        email: decoded.email,
        fullName: decoded.fullName,
        tenantId: decoded.tenantId,
        role: decoded.role,
      };

      request.user = user;
      request.tenantId = decoded.tenantId;
      return true;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Authentication session has expired. Please sign in again.'
        );
      }
      throw new UnauthorizedException('Invalid authentication credentials');
    }
  }
}
