import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { InvoicesService } from './invoices.service';
import { PaymentsService } from './payments.service';
import { BillingRunsService } from './billing-runs.service';

@Module({
  controllers: [BillingController],
  providers: [InvoicesService, PaymentsService, BillingRunsService],
  exports: [InvoicesService, PaymentsService, BillingRunsService],
})
export class BillingModule {}
