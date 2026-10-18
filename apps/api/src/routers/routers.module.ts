import { Module } from '@nestjs/common';
import { RoutersController } from './routers.controller';
import { RoutersService } from './routers.service';
import { RouterAdapterFactory } from './router-adapter.factory';
import { PppoeSetupService } from './pppoe-setup.service';

@Module({
  controllers: [RoutersController],
  providers: [RoutersService, RouterAdapterFactory, PppoeSetupService],
  exports: [RoutersService, RouterAdapterFactory, PppoeSetupService],
})
export class RoutersModule {}
