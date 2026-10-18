import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole } from '@mikrotik-billing/shared';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, CurrentTenant, CurrentUser } from '../common/decorators';
import { AuthenticatedUser } from '../common/auth-user.interface';
import { ServiceLifecycleService } from './service-lifecycle.service';
import {
  RunLifecycleCycleDto,
  ManualLifecycleOverrideDto,
} from './service-lifecycle.dto';

@Controller('lifecycle')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceLifecycleController {
  constructor(private readonly lifecycleService: ServiceLifecycleService) {}

  @Post('run-cycle')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN)
  async runCycle(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RunLifecycleCycleDto
  ) {
    return this.lifecycleService.executeCycle(tenantId, dto, user.userId);
  }

  @Post('override')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN)
  async manualOverride(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ManualLifecycleOverrideDto
  ) {
    return this.lifecycleService.manualOverride(tenantId, dto, user.userId);
  }

  @Get('reconciliation')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.AUDITOR
  )
  async getReconciliation(@CurrentTenant() tenantId: string) {
    return this.lifecycleService.reconcileServiceStates(tenantId);
  }
}
