import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole, SubscriptionStatus } from '@mikrotik-billing/shared';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, CurrentTenant, CurrentUser } from '../common/decorators';
import { AuthenticatedUser } from '../common/auth-user.interface';
import { SubscribersService } from './subscribers.service';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriberDto,
  UpdateSubscriberDto,
  ChangeServiceStatusDto,
  ChangePackageDto,
  RenewSubscriptionDto,
} from './subscribers.dto';

@Controller('subscribers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscribersController {
  constructor(
    private readonly subscribersService: SubscribersService,
    private readonly subscriptionsService: SubscriptionsService
  ) {}

  @Get()
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.CASHIER,
    UserRole.AUDITOR
  )
  async listSubscribers(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: SubscriptionStatus,
    @Query('routerId') routerId?: string,
    @Query('packageId') packageId?: string,
    @Query('isArchived') isArchived?: string
  ) {
    return this.subscribersService.list(tenantId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      status,
      routerId,
      packageId,
      isArchived: isArchived === 'true',
    });
  }

  @Get(':id')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.CASHIER,
    UserRole.AUDITOR
  )
  async getSubscriber(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.subscribersService.getById(tenantId, id);
  }

  @Post()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async createSubscriber(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubscriberDto
  ) {
    return this.subscribersService.create(tenantId, dto, user.userId);
  }

  @Patch(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async updateSubscriber(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateSubscriberDto
  ) {
    return this.subscribersService.update(tenantId, id, dto, user.userId);
  }

  @Post(':id/service-status')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async changeServiceStatus(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ChangeServiceStatusDto
  ) {
    return this.subscribersService.changeServiceStatus(tenantId, id, dto, user.userId);
  }

  @Post(':id/change-package')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async changePackage(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ChangePackageDto
  ) {
    const subscriber = await this.subscribersService.getById(tenantId, id);
    const activeSub = subscriber.subscriptions[0];
    if (!activeSub) {
      throw new Error('Subscriber has no active subscription to change package for.');
    }
    return this.subscriptionsService.changePackage(
      tenantId,
      activeSub.id,
      dto.packageId,
      user.userId
    );
  }

  @Post(':id/renew')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR, UserRole.CASHIER)
  async renewSubscription(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RenewSubscriptionDto
  ) {
    const subscriber = await this.subscribersService.getById(tenantId, id);
    const activeSub = subscriber.subscriptions[0];
    if (!activeSub) {
      throw new Error('Subscriber has no active subscription to renew.');
    }
    return this.subscriptionsService.renewSubscription(
      tenantId,
      activeSub.id,
      dto.extensionDays,
      user.userId
    );
  }

  @Post(':id/reprovision')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async reprovision(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.subscribersService.reprovision(tenantId, id, user.userId);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN)
  async toggleArchive(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('isArchived') isArchived?: boolean
  ) {
    return this.subscribersService.archive(
      tenantId,
      id,
      isArchived !== undefined ? isArchived : true,
      user.userId
    );
  }
}
