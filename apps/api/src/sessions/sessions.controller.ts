import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@mikrotik-billing/shared';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, CurrentTenant, CurrentUser } from '../common/decorators';
import { AuthenticatedUser } from '../common/auth-user.interface';
import { SessionsService } from './sessions.service';
import { DisconnectSessionDto } from './sessions.dto';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.CASHIER,
    UserRole.AUDITOR
  )
  async listSessions(
    @CurrentTenant() tenantId: string,
    @Query('routerId') routerId?: string,
    @Query('search') search?: string
  ) {
    return this.sessionsService.list(tenantId, { routerId, search });
  }

  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async disconnectSession(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DisconnectSessionDto
  ) {
    return this.sessionsService.disconnect(tenantId, dto, user.userId);
  }
}
