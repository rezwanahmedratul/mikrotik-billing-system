import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
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
import { RoutersService } from './routers.service';
import {
  CreateRouterDto,
  UpdateRouterDto,
  TestRouterConnectionDto,
} from './routers.dto';

@Controller('routers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoutersController {
  constructor(private readonly routersService: RoutersService) {}

  @Get()
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.CASHIER,
    UserRole.AUDITOR
  )
  async listRouters(@CurrentTenant() tenantId: string) {
    return this.routersService.list(tenantId);
  }

  @Get(':id')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.CASHIER,
    UserRole.AUDITOR
  )
  async getRouter(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.routersService.getById(tenantId, id);
  }

  @Post()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async createRouter(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRouterDto
  ) {
    return this.routersService.create(tenantId, dto, user.userId);
  }

  @Patch(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async updateRouter(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRouterDto
  ) {
    return this.routersService.update(tenantId, id, dto, user.userId);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async testConnection(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto?: TestRouterConnectionDto
  ) {
    return this.routersService.testConnection(tenantId, id, dto);
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async syncHealth(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.routersService.syncHealth(tenantId, id);
  }

  @Delete(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN)
  async deleteRouter(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.routersService.delete(tenantId, id, user.userId);
  }
}
