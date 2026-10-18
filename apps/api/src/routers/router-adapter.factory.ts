import { Injectable } from '@nestjs/common';
import {
  RouterAdapter,
  RouterConnectionConfig,
  MockRouterAdapter,
} from '@mikrotik-billing/shared';
import { RouterOsAdapter } from './routeros-adapter';

@Injectable()
export class RouterAdapterFactory {
  private mockAdapter = new MockRouterAdapter();
  private routerOsAdapter = new RouterOsAdapter();

  getAdapter(config: RouterConnectionConfig): RouterAdapter {
    const isGlobalMock = process.env.ROUTER_MOCK_MODE === 'true';
    const isMockHost =
      config.host.toLowerCase().includes('mock') ||
      config.host.toLowerCase().includes('.local') ||
      config.host === '192.0.2.1' ||
      config.host === '192.0.2.2';

    if (isGlobalMock || isMockHost) {
      return this.mockAdapter;
    }

    return this.routerOsAdapter;
  }
}
