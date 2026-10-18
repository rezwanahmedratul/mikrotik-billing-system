import { Module } from '@nestjs/common';
import { RoutersModule } from '../routers/routers.module';
import { SubscribersController } from './subscribers.controller';
import { SubscribersService } from './subscribers.service';
import { SubscriptionsService } from './subscriptions.service';
import { PppoeProvisioningService } from './pppoe-provisioning.service';

@Module({
  imports: [RoutersModule],
  controllers: [SubscribersController],
  providers: [SubscribersService, SubscriptionsService, PppoeProvisioningService],
  exports: [SubscribersService, SubscriptionsService, PppoeProvisioningService],
})
export class SubscribersModule {}
