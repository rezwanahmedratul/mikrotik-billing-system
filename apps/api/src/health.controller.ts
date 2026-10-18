import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Response } from 'express';
import { Redis } from 'ioredis';
import pg from 'pg';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Application process is alive' })
  getLiveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe endpoint verifying Postgres and Redis connectivity' })
  @ApiResponse({ status: 200, description: 'Application is ready and dependencies are healthy' })
  @ApiResponse({ status: 503, description: 'Application dependencies are unreachable' })
  async getReadiness(@Res() res: Response) {
    const checks = {
      database: 'unknown',
      cache: 'unknown',
    };
    let isHealthy = true;

    // Check Postgres database connectivity
    const dbUrl =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/mikrotik_billing?schema=public';
    try {
      const client = new pg.Client({
        connectionString: dbUrl,
        connectionTimeoutMillis: 2000,
      });
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      checks.database = 'ok';
    } catch (err: any) {
      checks.database = `error: ${err.message || 'connection failed'}`;
      isHealthy = false;
    }

    // Check Redis cache connectivity
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      const redis = new Redis(redisUrl, {
        connectTimeout: 2000,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
      await redis.connect();
      await redis.ping();
      await redis.quit();
      checks.cache = 'ok';
    } catch (err: any) {
      checks.cache = `error: ${err.message || 'connection failed'}`;
      isHealthy = false;
    }

    const statusCode = isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return res.status(statusCode).json({
      status: isHealthy ? 'ready' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: checks,
    });
  }
}
