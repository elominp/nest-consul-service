import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConsulServiceBootstrap } from './consul-service-bootstrap.class';

@Global()
@Module({})
export class ConsulServiceModule {
  static forRoot(adapter: string): DynamicModule {
    const env = process.env.NODE_ENV || 'development';
    const consulServiceProvider = {
      provide: 'ConsulService',
      useClass: ConsulServiceBootstrap,
    };

    return {
      module: ConsulServiceModule,
      components: [consulServiceProvider],
      exports: [consulServiceProvider],
    };
  }
}
