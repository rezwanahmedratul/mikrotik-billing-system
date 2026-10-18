import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for versioned API
  app.setGlobalPrefix('api/v1');

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('MikroTik ISP Billing & Management API')
    .setDescription(
      'Multi-tenant API for managing subscribers, MikroTik routers, PPPoE credentials, billing, and network operations'
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || process.env.API_PORT || 4000;
  await app.listen(port);
  console.log(`[API] Server running on http://localhost:${port}/api/v1`);
  console.log(`[API] Swagger documentation on http://localhost:${port}/api/docs`);
}

// Only bootstrap directly when running as entry point
if (process.env.NODE_ENV !== 'test') {
  bootstrap().catch((err) => {
    console.error('[API] Failed to start server:', err);
    process.exit(1);
  });
}
