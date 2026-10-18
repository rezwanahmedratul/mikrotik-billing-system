import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health.controller.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { TenantsController } from './tenants/tenants.controller.js';
import { TenantsService } from './tenants/tenants.service.js';
import { RoutersModule } from './routers/routers.module.js';
import { PackagesModule } from './packages/packages.module.js';
import { AuditService } from './common/audit.service.js';
import { JwtAuthGuard } from './common/jwt-auth.guard.js';
import { RolesGuard } from './common/roles.guard.js';

@Module({
  imports: [RoutersModule, PackagesModule],
  controllers: [HealthController, AuthController, TenantsController],
  providers: [
    AuditService,
    AuthService,
    TenantsService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
