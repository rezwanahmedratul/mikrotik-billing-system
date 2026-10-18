import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { UserRole } from '@mikrotik-billing/shared';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles, CurrentTenant, CurrentUser, Public } from '../common/decorators';
import { AuthenticatedUser } from '../common/auth-user.interface';
import { PaymentGatewaysService } from './payment-gateways.service';
import { InitiateGatewayPaymentDto } from './payment-gateways.dto';

@Controller()
export class PaymentGatewaysController {
  constructor(private readonly gatewaysService: PaymentGatewaysService) {}

  @Post('payment-gateways/initiate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    UserRole.PLATFORM_ADMIN,
    UserRole.ISP_ADMIN,
    UserRole.ISP_OPERATOR,
    UserRole.CASHIER
  )
  async initiatePayment(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitiateGatewayPaymentDto
  ) {
    return this.gatewaysService.initiatePayment(tenantId, dto, user.userId);
  }

  @Public()
  @Post('webhooks/payments/:provider')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: any,
    @Query('tenantId') queryTenantId?: string
  ) {
    const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
    return this.gatewaysService.processWebhook(
      provider,
      rawBody,
      headers,
      queryTenantId
    );
  }

  @Get('payment-gateways/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.ISP_ADMIN, UserRole.AUDITOR)
  async listEvents(
    @CurrentTenant() tenantId: string,
    @Query('limit') limit?: string
  ) {
    return this.gatewaysService.listEvents(tenantId, limit ? Number(limit) : 50);
  }
}
