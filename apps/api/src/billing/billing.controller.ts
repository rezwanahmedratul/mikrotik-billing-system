import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole, InvoiceStatus } from '@mikrotik-billing/shared';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, CurrentTenant, CurrentUser } from '../common/decorators';
import { AuthenticatedUser } from '../common/auth-user.interface';
import { InvoicesService } from './invoices.service';
import { PaymentsService } from './payments.service';
import { BillingRunsService } from './billing-runs.service';
import {
  CreateInvoiceDto,
  RecordPaymentDto,
  BillingRunDto,
} from './billing.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly paymentsService: PaymentsService,
    private readonly billingRunsService: BillingRunsService
  ) {}

  // ==========================================
  // Invoices Endpoints
  // ==========================================
  @Get('invoices')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.CASHIER,
    UserRole.AUDITOR
  )
  async listInvoices(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('subscriberId') subscriberId?: string
  ) {
    return this.invoicesService.list(tenantId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
      status,
      subscriberId,
    });
  }

  @Get('invoices/:id')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.CASHIER,
    UserRole.AUDITOR
  )
  async getInvoice(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoicesService.getById(tenantId, id);
  }

  @Post('invoices')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR, UserRole.CASHIER)
  async createInvoice(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvoiceDto
  ) {
    return this.invoicesService.create(tenantId, dto, user.userId);
  }

  @Post('invoices/:id/void')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN)
  async voidInvoice(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('reason') reason?: string
  ) {
    return this.invoicesService.voidInvoice(tenantId, id, reason, user.userId);
  }

  // ==========================================
  // Payments Endpoints
  // ==========================================
  @Get('payments')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.CASHIER,
    UserRole.AUDITOR
  )
  async listPayments(
    @CurrentTenant() tenantId: string,
    @Query('subscriberId') subscriberId?: string,
    @Query('search') search?: string
  ) {
    return this.paymentsService.list(tenantId, { subscriberId, search });
  }

  @Get('payments/reconciliation')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.CASHIER,
    UserRole.AUDITOR
  )
  async getReconciliation(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.paymentsService.getReconciliationReport(tenantId, { startDate, endDate });
  }

  @Post('payments')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.ISP_OPERATOR, UserRole.CASHIER)
  async recordPayment(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RecordPaymentDto
  ) {
    return this.paymentsService.recordPayment(tenantId, dto, user.userId);
  }

  @Post('payments/:id/reverse')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN)
  async reversePayment(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('reason') reason?: string
  ) {
    return this.paymentsService.reversePayment(tenantId, id, reason, user.userId);
  }

  // ==========================================
  // Billing Runs Endpoints
  // ==========================================
  @Get('billing-runs')
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.AUDITOR
  )
  async listBillingRuns(@CurrentTenant() tenantId: string) {
    return this.billingRunsService.list(tenantId);
  }

  @Post('billing-runs')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN)
  async executeBillingRun(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BillingRunDto
  ) {
    return this.billingRunsService.executeBillingRun(tenantId, dto, user.userId);
  }
}
