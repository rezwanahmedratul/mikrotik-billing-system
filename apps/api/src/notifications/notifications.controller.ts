import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole, SmsStatus, SmsTemplateType } from '@mikrotik-billing/shared';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, CurrentTenant, CurrentUser } from '../common/decorators';
import { AuthenticatedUser } from '../common/auth-user.interface';
import { NotificationsService } from './notifications.service';
import {
  SendDirectSmsDto,
  SendTemplateSmsDto,
  UpdateTemplateDto,
} from './notifications.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('templates')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.AUDITOR
  )
  async listTemplates(@CurrentTenant() tenantId: string) {
    return this.notificationsService.listTemplates(tenantId);
  }

  @Put('templates/:type')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN)
  async updateTemplate(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('type') type: SmsTemplateType,
    @Body() dto: UpdateTemplateDto
  ) {
    return this.notificationsService.updateTemplate(tenantId, type, dto, user.userId);
  }

  @Get('logs')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.CASHIER,
    UserRole.AUDITOR
  )
  async listLogs(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: SmsStatus,
    @Query('search') search?: string,
    @Query('limit') limit?: string
  ) {
    return this.notificationsService.listJobs(tenantId, {
      status,
      search,
      limit: limit ? Number(limit) : 50,
    });
  }

  @Post('send')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async sendDirectSms(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendDirectSmsDto
  ) {
    return this.notificationsService.enqueueDirectSms(tenantId, dto, user.userId);
  }

  @Post('send-template')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async sendTemplateSms(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendTemplateSmsDto
  ) {
    return this.notificationsService.sendTemplateSms(tenantId, dto, user.userId);
  }

  @Post('logs/:id/retry')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async retryJob(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.notificationsService.retryJob(tenantId, id);
  }
}
