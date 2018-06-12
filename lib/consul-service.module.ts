import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConsulServiceBootImpl } from './consul-service-boot.class';
import { ConsulServiceOptionsImpl } from './consul-service-options.class';
import { Options } from './consul-service.options';

@Global()
@Module({})
export class ConsulServiceModule {
  static init(options: Options): DynamicModule {
    const consulServiceOptionsProvider = {
      provide: 'ConsulServiceOptions',
      useValue: options,
    };

    const consulServiceProvider = {
      provide: 'ConsulService',
      useClass: ConsulServiceOptionsImpl,
    };

    return {
      module: ConsulServiceModule,
      components: [consulServiceOptionsProvider, consulServiceProvider],
      exports: [consulServiceProvider],
    };
  }

  static initWithBoot(): DynamicModule {
    const consulServiceProvider = {
      provide: 'ConsulService',
      useClass: ConsulServiceBootImpl,
    };

    return {
      module: ConsulServiceModule,
      components: [consulServiceProvider],
      exports: [consulServiceProvider],
    };
  }
}
