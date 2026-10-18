import { Controller, Post, Get, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto, RegisterTenantDto } from './auth.dto.js';
import { Public, CurrentUser, CurrentTenant } from '../common/decorators.js';
import { JwtAuthGuard } from '../common/jwt-auth.guard.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in to ISP tenant or platform admin console' })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT bearer token' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  @ApiResponse({ status: 403, description: 'Too many attempts or tenant suspended' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ip, userAgent);
  }

  @Public()
  @Post('register-tenant')
  @ApiOperation({ summary: 'Register a new ISP tenant organization with initial admin user' })
  @ApiResponse({ status: 201, description: 'Tenant registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or organization code taken' })
  async registerTenant(@Body() dto: RegisterTenantDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.registerTenant(dto, ip, userAgent);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile and active tenant' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getMe(@CurrentUser('userId') userId: string, @CurrentTenant() tenantId: string) {
    return this.authService.getMe(userId, tenantId);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and record session termination audit log' })
  async logout(
    @CurrentUser('userId') userId: string,
    @CurrentTenant() tenantId: string,
    @Req() req: Request
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.authService.logout(userId, tenantId, ip);
  }
}
