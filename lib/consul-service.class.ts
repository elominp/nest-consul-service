import { OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import * as md5encode from 'blueimp-md5';
import * as Consul from 'consul';
import * as os from 'os';
import { Options } from './consul-service.options';
import { get } from 'lodash';
import { LoggerService } from '@nestjs/common';

export class ConsulService implements OnModuleInit, OnModuleDestroy {
    private readonly discoveryHost: string;
    private readonly serviceId: string;
    private readonly serviceName: string;
    private readonly servicePort: string;
    private readonly timeout: string;
    private readonly interval: string;
    private readonly maxRetry: number;
    private readonly retryInterval: number;
    private readonly logger: boolean | LoggerService;

    constructor(
        @Inject('ConsulClient') private readonly consul: Consul,
        options: Options,
    ) {
        this.discoveryHost = get(
            options,
            'consul.discoveryHost',
            this.getIPAddress(),
        );
        this.serviceId = get(options, 'web.serviceId');
        this.serviceName = get(options, 'web.serviceName');
        this.servicePort = get(options, 'web.port');
        this.timeout = get(options, 'consul.check.timeout', '1s');
        this.interval = get(options, 'consul.check.interval', '10s');
        this.maxRetry = get(options, 'consul.max_retry', 5);
        this.retryInterval = get(options, 'consul.retry_interval', 3000);
        this.logger = get(options, 'logger', false);
    }

    async getServices(name: string, options: object = { passing: true }) {
        return this.consul.health.service({
            ...options,
            service: name,
        });
    }

    async onModuleInit(): Promise<any> {
        const service = this.getService();

        let current = 0;
        while (true) {
            try {
                await this.consul.agent.service.register(service);
                this.logger &&
                (this.logger as LoggerService).log('Register the service success.');
                break;
            } catch (e) {
                if (this.maxRetry !== -1 && ++current > this.maxRetry) {
                    this.logger &&
                    (this.logger as LoggerService).error(
                        'Register the service fail.',
                        e,
                    );
                    break;
                }

                this.logger &&
                (this.logger as LoggerService).warn(
                    `Register the service fail, will retry after ${this.retryInterval}`,
                );
                await this.sleep(this.retryInterval);
            }
        }
    }

    async onModuleDestroy(): Promise<any> {
        const service = this.getService();

        let current = 0;
        while (true) {
            try {
                await this.consul.agent.service.deregister(service);
                this.logger &&
                (this.logger as LoggerService).log('Deregister the service success.');
                break;
            } catch (e) {
                if (this.maxRetry !== -1 && ++current > this.maxRetry) {
                    this.logger &&
                    (this.logger as LoggerService).error(
                        'Deregister the service fail.',
                        e,
                    );
                    break;
                }

                this.logger &&
                (this.logger as LoggerService).warn(
                    `Deregister the service fail, will retry after ${
                        this.retryInterval
                        }`,
                );
                await this.sleep(this.retryInterval);
            }
        }
    }

    private getService() {
        return {
            id:
            this.serviceId ||
            md5encode(`${this.discoveryHost}:${this.servicePort}`),
            name: this.serviceName,
            address: this.discoveryHost,
            port: this.servicePort,
            check: {
                id: 'nest_consul_service_api_health_check',
                name: `HTTP API health check on port ${this.servicePort}`,
                http: `http://${this.discoveryHost}:${this.servicePort}/health`,
                interval: this.interval,
                timeout: this.timeout,
            },
        };
    }

    private getIPAddress() {
        const interfaces = os.networkInterfaces();
        for (const devName in interfaces) {
            if (!interfaces.hasOwnProperty(devName)) {
                continue;
            }

            const iface = interfaces[devName];

            for (let i = 0; i < iface.length; i++) {
                const alias = iface[i];
                if (
                    alias.family === 'IPv4' &&
                    alias.address !== '127.0.0.1' &&
                    !alias.internal
                ) {
                    return alias.address;
                }
            }
        }
    }

    private sleep(time: number = 2000) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, time);
        });
    }
}
