import {
  OnModuleInit,
  OnModuleDestroy,
  Inject,
  Injectable,
} from '@nestjs/common';
import * as md5encode from 'blueimp-md5';
import * as Consul from 'consul';
import { Bootstrap } from 'nest-bootstrap';
import * as os from 'os';
import { Event } from './consul-service.event';
import { ConsulService } from './consul-service.interface';

@Injectable()
export class ConsulServiceBootImpl
  implements OnModuleInit, OnModuleDestroy, ConsulService {
  private readonly discoveryHost: string;
  private readonly serviceId: string;
  private readonly serviceName: string;
  private readonly servicePort: string;
  private readonly timeout: string;
  private readonly interval: string;

  constructor(
    @Inject('ConsulClient') private readonly consul: Consul,
    @Inject('BootstrapProvider') private readonly bootstrap: Bootstrap,
  ) {
    this.discoveryHost = bootstrap.get(
      'consul.discoveryHost',
      this.getIPAddress(),
    );
    this.serviceId = bootstrap.get('web.serviceId');
    this.serviceName = bootstrap.get('web.serviceName');
    this.servicePort = bootstrap.get('web.port');
    this.timeout = bootstrap.get('consul.check.timeout', '1s');
    this.interval = bootstrap.get('consul.check.interval', '10s');
  }

  async getServices(name: string, options: object = { passing: true }) {
    return this.consul.health.service({
      ...options,
      service: name,
    });
  }

  async onModuleInit(): Promise<any> {
    const maxRetry = this.bootstrap.get('consul.retry.max', -1);
    const retryInterval = this.bootstrap.get('consul.retry.interval', 5000);
    const service = this.getService();

    let current = 0;
    while (true) {
      try {
        await this.consul.agent.service.register(service);
        Event.emit('consul.service.register.success', service);
        break;
      } catch (e) {
        if (maxRetry !== -1 && ++current > maxRetry) {
          Event.emit('consul.service.register.fail', service);
          break;
        }

        Event.emit('consul.service.register.retrying', service);
        await this.sleep(retryInterval);
      }
    }

    // process.on('SIGINT', async () => await this.onModuleDestroy());
    // process.on('SIGTERM', async () => await this.onModuleDestroy());
  }

  async onModuleDestroy(): Promise<any> {
    const maxRetry = this.bootstrap.get('consul.retry.max', -1);
    const retryInterval = this.bootstrap.get('consul.retry.interval', 5000);
    const service = this.getService();

    let current = 0;
    while (true) {
      try {
        await this.consul.agent.service.deregister(service);
        Event.emit('consul.service.deregister.success', service);
        break;
      } catch (e) {
        if (maxRetry !== -1 && ++current > maxRetry) {
          Event.emit('consul.service.deregister.fail', service);
          break;
        }

        Event.emit('consul.service.deregister.retrying', service);
        await this.sleep(retryInterval);
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
        id: 'api',
        name: `HTTP API on port ${this.servicePort}`,
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
