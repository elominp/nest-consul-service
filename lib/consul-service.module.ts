import { Module, DynamicModule, Global } from '@nestjs/common';
import {
  RegisterOptions,
  RegisterBootOptions,
  Check,
} from './consul-service.options';
import * as Consul from 'consul';
import { ConsulService } from './consul-service.class';
import { Boot } from 'nest-boot';

@Global()
@Module({})
export class ConsulServiceModule {
  static register(options: RegisterOptions): DynamicModule {
    const consulServiceProvider = {
      provide: 'ConsulService',
      useFactory: async (consul: Consul): Promise<ConsulService> => {
        return new ConsulService(consul, {
          web: {
            serviceId: options.serviceId,
            serviceName: options.serviceName,
            port: options.port,
          },
          consul: options.consul,
          logger: options.logger,
        });
      },
      inject: ['ConsulClient', 'BootstrapProvider'],
    };
    const consulServiceHealthChecksProvider = {
      provide: 'ConsulServiceHealthChecks',
      useFactory: (): (() => Check)[] => {
        return options.checks || [];
      },
      inject: [],
    };

    return {
      module: ConsulServiceModule,
      components: [consulServiceProvider, consulServiceHealthChecksProvider],
      exports: [consulServiceProvider, consulServiceHealthChecksProvider],
    };
  }

  static registerByBoot(options?: RegisterBootOptions): DynamicModule {
    const consulServiceProvider = {
      provide: 'ConsulService',
      useFactory: async (
        consul: Consul,
        boot: Boot,
      ): Promise<ConsulService> => {
        return new ConsulService(consul, {
          web: boot.get('web'),
          consul: boot.get('consul'),
          logger: options.logger,
        });
      },
      inject: ['ConsulClient', 'BootstrapProvider'],
    };

    const consulServiceHealthChecksProvider = {
      provide: 'ConsulServiceHealthChecks',
      useFactory: (): (() => Check)[] => {
        return options.checks || [];
      },
      inject: [],
    };

    return {
      module: ConsulServiceModule,
      components: [consulServiceProvider, consulServiceHealthChecksProvider],
      exports: [consulServiceProvider, consulServiceHealthChecksProvider],
    };
  }
}
