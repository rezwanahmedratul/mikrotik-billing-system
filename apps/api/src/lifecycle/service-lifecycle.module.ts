import { Module } from '@nestjs/common';
import { ServiceLifecycleController } from './service-lifecycle.controller';
import { ServiceLifecycleService } from './service-lifecycle.service';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [SubscribersModule, NotificationsModule],
  controllers: [ServiceLifecycleController],
  providers: [ServiceLifecycleService],
  exports: [ServiceLifecycleService],
})
export class ServiceLifecycleModule {}
