import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
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
import { PackagesService } from './packages.service';
import { CreatePackageDto, UpdatePackageDto } from './packages.dto';

@Controller('packages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.CASHIER,
    UserRole.AUDITOR
  )
  async listPackages(
    @CurrentTenant() tenantId: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('search') search?: string
  ) {
    return this.packagesService.list(tenantId, {
      includeArchived: includeArchived === 'true',
      search,
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
  async getPackage(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.packagesService.getById(tenantId, id);
  }

  @Post()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async createPackage(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePackageDto
  ) {
    return this.packagesService.create(tenantId, dto, user.userId);
  }

  @Patch(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async updatePackage(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePackageDto
  ) {
    return this.packagesService.update(tenantId, id, dto, user.userId);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR)
  async toggleArchive(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('isArchived') isArchived?: boolean
  ) {
    return this.packagesService.archive(
      tenantId,
      id,
      isArchived !== undefined ? isArchived : true,
      user.userId
    );
  }

  @Delete(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN)
  async deletePackage(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string
  ) {
    return this.packagesService.delete(tenantId, id, user.userId);
  }
}
