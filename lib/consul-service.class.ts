import { OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import * as md5encode from 'blueimp-md5';
import * as Consul from 'consul';
import * as os from 'os';
import { Options } from './consul-service.options';
import { get } from 'lodash';
import { LoggerService } from '@nestjs/common';
import { Server } from "./server";
import { Watcher } from "./consul-service.watcher";

export class ConsulService implements OnModuleInit, OnModuleDestroy {
    private readonly CRITICAL = 'critical';
    private readonly PASSING = 'passing';
    private readonly WARNING = 'warning';

    private readonly discoveryHost: string;
    private readonly serviceId: string;
    private readonly serviceName: string;
    private readonly servicePort: string;
    private readonly timeout: string;
    private readonly interval: string;
    private readonly maxRetry: number;
    private readonly retryInterval: number;
    private readonly logger: boolean | LoggerService;

    private readonly services = {};
    private readonly watchers = {};
    private timer;

    constructor(
        @Inject('ConsulClient') private readonly consul: Consul,
        options: Options,
    ) {
        this.discoveryHost = get(options, 'consul.discoveryHost', this.getIPAddress());
        this.serviceId = get(options, 'web.serviceId');
        this.serviceName = get(options, 'web.serviceName');
        this.servicePort = get(options, 'web.port');
        this.timeout = get(options, 'consul.health_check.timeout', '1s');
        this.interval = get(options, 'consul.health_check.interval', '10s');
        this.maxRetry = get(options, 'consul.max_retry', 5);
        this.retryInterval = get(options, 'consul.retry_interval', 3000);
        this.logger = get(options, 'logger', false);

        this.initialCheck();
    }

    async init() {
        const newServices = [];
        const services = await this.consul.agent.service.list();
        for (const serviceId in services) {
            if (services.hasOwnProperty(serviceId)) {
                const service = get(services[serviceId], 'Service');
                newServices.push(service);
                await this.addService(service);
            }
        }
        for (const service in this.services) {
            if (this.services.hasOwnProperty(service)) {
                if (newServices.indexOf(service) === -1) {
                    this.removeService(service);
                }
            }
        }
    }

    async getServices(name: string, options: { passing: boolean }) {
        const nodes = this.services[name];
        if (!nodes) {
            return [];
        }

        if (options && options.passing) {
            return nodes.filter(node => node.status === this.PASSING);
        }

        return nodes;
    }

    async onModuleInit(): Promise<any> {
        const service = this.getService();

        let current = 0;
        while (true) {
            try {
                await this.consul.agent.service.register(service);
                this.logger && (this.logger as LoggerService).log('Register the service success.');
                break;
            } catch (e) {
                if (this.maxRetry !== -1 && ++current > this.maxRetry) {
                    this.logger && (this.logger as LoggerService).error('Register the service fail.', e);
                    break;
                }

                this.logger && (this.logger as LoggerService).warn(`Register the service fail, will retry after ${this.retryInterval}`);
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
                this.logger && (this.logger as LoggerService).log('Deregister the service success.');
                break;
            } catch (e) {
                if (this.maxRetry !== -1 && ++current > this.maxRetry) {
                    this.logger && (this.logger as LoggerService).error('Deregister the service fail.', e);
                    break;
                }

                this.logger && (this.logger as LoggerService).warn(`Deregister the service fail, will retry after ${this.retryInterval}`);
                await this.sleep(this.retryInterval);
            }
        }
    }

    private initialCheck() {
        this.timer = setInterval(async () => {
            for (const key in this.watchers) {
                if (this.watchers.hasOwnProperty(key)) {
                    const watcher = this.watchers[key];
                    const lastChangeTime = watcher.getLastChangeTime();
                    if (lastChangeTime) {
                        const now = new Date().getTime();
                        if (now - lastChangeTime > 300000) {
                            watcher.rewatch();
                        }
                    }
                }
            }
            await this.init();
        }, 15000)
    }

    private async addService(serviceName: string) {
        if (!serviceName) {
            return null;
        }

        const nodes = await this.consul.health.service(serviceName);
        this.addNodes(serviceName, nodes);
        this.createServiceWatcher(serviceName);
    }

    private createServiceWatcher(serviceName,) {
        const watcher = this.watchers[serviceName] = new Watcher(this.consul, {
            method: this.consul.health.service,
            params: { service: serviceName }
        });
        watcher.watch((e, nodes) => e ? void 0 : this.addNodes(serviceName, nodes));
    }

    private addNodes(serviceName, nodes) {
        this.services[serviceName] = nodes.map(node => {
            let status = this.CRITICAL;
            if (node.Checks.length) {
                status = this.PASSING;
            }
            for (let i = 0; i < node.Checks; i++) {
                const check = node.Checks[i];
                if (check.Status === this.CRITICAL) {
                    status = this.CRITICAL;
                    break;
                } else if (check.Status === this.WARNING) {
                    status = this.WARNING;
                    return true;
                }
            }

            return { ...node, status };
        }).map(node => {
            const server = new Server(get(node, 'Node.Address', '127.0.0.1'), get(node, 'Service.Port'));
            server.name = get(node, 'Node.Node');
            server.status = get(node, 'status', this.CRITICAL);
            return server;
        });
    }

    private removeService(serviceName: string) {
        delete this.services[serviceName];
        const watcher = this.watchers[serviceName];
        if (watcher) {
            watcher.clear();
            delete this.watchers[serviceName];
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
        return new Promise(resolve => {
            setTimeout(() => resolve(), time);
        });
    }
}