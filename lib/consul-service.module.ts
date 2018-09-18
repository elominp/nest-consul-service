import { Module, DynamicModule, Global } from '@nestjs/common';
import {
    RegisterOptions,
    Check,
} from './consul-service.options';
import * as Consul from 'consul';
import { ConsulService } from './consul-service.class';
import {
    BOOTSTRAP_PROVIDER,
    CONSUL_PROVIDER,
    CONSUL_SERVICE_CHECKS_PROVIDER,
    CONSUL_SERVICE_PROVIDER,
    BOOT_ADAPTER
} from "./constants";
import { IBoot } from "./boot.interface";

@Global()
@Module({})
export class ConsulServiceModule {
    static register(options: RegisterOptions): DynamicModule {
        const inject = [CONSUL_PROVIDER];
        if (options.adapter === BOOT_ADAPTER) {
            inject.push(BOOTSTRAP_PROVIDER);
        }
        const consulServiceProvider = {
            provide: CONSUL_SERVICE_PROVIDER,
            useFactory: async (consul: Consul, boot: IBoot): Promise<ConsulService> => {
                let configs = {
                    web: {
                        serviceId: options.serviceId,
                        serviceName: options.serviceName,
                        port: options.port,
                    },
                    consul: options.consul,
                    logger: options.logger,
                };
                if (options.adapter === BOOT_ADAPTER) {
                    configs = {
                        web: boot.get('web'),
                        consul: boot.get('consul'),
                        logger: options.logger,
                    }
                }
                const service = new ConsulService(consul, configs);
                await service.init();
                return service;
            },
            inject,
        };
        const consulServiceHealthChecksProvider = {
            provide: CONSUL_SERVICE_CHECKS_PROVIDER,
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
