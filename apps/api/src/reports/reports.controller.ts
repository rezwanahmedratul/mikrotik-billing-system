import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole, AuditAction } from '@mikrotik-billing/shared';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, CurrentTenant } from '../common/decorators';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * High-level operational dashboard overview
   */
  @Get('dashboard-overview')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.CASHIER,
    UserRole.AUDITOR
  )
  async getDashboardOverview(@CurrentTenant() tenantId: string) {
    return this.reportsService.getDashboardOverview(tenantId);
  }

  /**
   * Cash collections, reversals, and cashier breakdown
   */
  @Get('collections')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.CASHIER,
    UserRole.AUDITOR
  )
  async getCollectionsReport(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('method') method?: string,
    @Query('cashierId') cashierId?: string
  ) {
    return this.reportsService.getCollectionsReport(tenantId, {
      startDate,
      endDate,
      method,
      cashierId,
    });
  }

  /**
   * Subscriber growth, activations, and churn trends
   */
  @Get('subscriber-growth')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.AUDITOR
  )
  async getSubscriberGrowthReport(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.reportsService.getSubscriberGrowthReport(tenantId, {
      startDate,
      endDate,
    });
  }

  /**
   * Unpaid invoices aging report and top debtors
   */
  @Get('aging')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.CASHIER,
    UserRole.AUDITOR
  )
  async getAgingReport(@CurrentTenant() tenantId: string) {
    return this.reportsService.getAgingReport(tenantId);
  }

  /**
   * Router gateways health and capacity utilization
   */
  @Get('router-health')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.AUDITOR
  )
  async getRouterHealthReport(@CurrentTenant() tenantId: string) {
    return this.reportsService.getRouterHealthReport(tenantId);
  }

  /**
   * Tenant audit log browsing with pagination and filtering
   */
  @Get('audit-logs')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.AUDITOR)
  async getAuditLogs(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: AuditAction,
    @Query('entityType') entityType?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string
  ) {
    return this.reportsService.getAuditLogs(tenantId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      action,
      entityType,
      userId,
      startDate,
      endDate,
      search,
    });
  }
}
