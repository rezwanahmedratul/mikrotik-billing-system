import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service.js';
import { CreateStaffDto, UpdateStaffDto, UpdateTenantSettingsDto } from './tenants.dto.js';
import { JwtAuthGuard } from '../common/jwt-auth.guard.js';
import { RolesGuard } from '../common/roles.guard.js';
import { CurrentTenant, CurrentUser, Roles } from '../common/decorators.js';
import { UserRole } from '@mikrotik-billing/shared';

@ApiTags('Tenants & Staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current organization profile and statistics' })
  @ApiResponse({ status: 200, description: 'Organization retrieved successfully' })
  async getCurrent(@CurrentTenant() tenantId: string) {
    return this.tenantsService.getCurrentTenant(tenantId);
  }

  @Patch('current')
  @Roles(UserRole.ISP_ADMIN)
  @ApiOperation({ summary: 'Update organization settings and contact info (Admin only)' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully' })
  async updateCurrent(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateTenantSettingsDto
  ) {
    return this.tenantsService.updateTenantSettings(tenantId, dto, userId);
  }

  @Get('staff')
  @ApiOperation({ summary: 'List all staff members and their roles for current tenant' })
  @ApiResponse({ status: 200, description: 'Staff members retrieved' })
  async listStaff(@CurrentTenant() tenantId: string) {
    return this.tenantsService.listStaff(tenantId);
  }

  @Post('staff')
  @Roles(UserRole.ISP_ADMIN)
  @ApiOperation({ summary: 'Create or invite new staff member to organization (Admin only)' })
  @ApiResponse({ status: 201, description: 'Staff member created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed or staff member exists' })
  async createStaff(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateStaffDto
  ) {
    return this.tenantsService.createStaff(tenantId, dto, userId);
  }

  @Patch('staff/:memberId')
  @Roles(UserRole.ISP_ADMIN)
  @ApiOperation({ summary: 'Update staff member role or active status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Staff member updated' })
  async updateStaff(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateStaffDto
  ) {
    return this.tenantsService.updateStaff(tenantId, memberId, dto, userId);
  }

  @Delete('staff/:memberId')
  @Roles(UserRole.ISP_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove staff member from organization (Admin only)' })
  @ApiResponse({ status: 200, description: 'Staff member removed' })
  async removeStaff(
    @CurrentTenant() tenantId: string,
    @CurrentUser('userId') userId: string,
    @Param('memberId') memberId: string
  ) {
    return this.tenantsService.removeStaff(tenantId, memberId, userId);
  }
}
