import { Module } from '@nestjs/common';
import { RoutersController } from './routers.controller';
import { RoutersService } from './routers.service';
import { RouterAdapterFactory } from './router-adapter.factory';

@Module({
  controllers: [RoutersController],
  providers: [RoutersService, RouterAdapterFactory],
  exports: [RoutersService, RouterAdapterFactory],
})
export class RoutersModule {}
