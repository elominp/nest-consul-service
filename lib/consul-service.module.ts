import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConsulServiceBootImpl } from './consul-service-boot.class';
import { ConsulServiceOptionsImpl } from './consul-service-options.class';
import { Options } from './consul-service.options';

@Global()
@Module({})
export class ConsulServiceModule {
  static forRoot(options: Options): DynamicModule {
    const env = process.env.NODE_ENV || 'development';
    const consulServiceOptionsProvider = {
      provide: 'ConsulServiceOptions',
      useValue: options,
    };

    const consulServiceProvider = {
      provide: 'ConsulService',
      useClass: options.useBootModule
        ? ConsulServiceBootImpl
        : ConsulServiceOptionsImpl,
    };

    return {
      module: ConsulServiceModule,
      components: [consulServiceOptionsProvider, consulServiceProvider],
      exports: [consulServiceProvider],
    };
  }
}
