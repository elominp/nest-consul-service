<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

## Description

This is a [Nest](https://github.com/nestjs/nest) module provide service registration and service discovery.

## Installation

```bash
$ npm i --save nest-consul-service nest-consul consul
```

## Quick Start

#### Import Module

```typescript
import { Module } from '@nestjs/common';
import { ConsulModule } from 'nest-consul';
import { ConsulServiceModule, Check, PASSING, WARNING, FAILURE } from 'nest-consul-service';

const checks = [
    (): Check => ({status: PASSING, message: 'ok'}),
    (): Check => ({status: WARNING, message: 'Memory using is high'}), 
    (): Check => ({status: FAILURE, message: 'Refuse service'}),
];

@Module({
  imports: [
      ConsulModule.register({
          host: '127.0.0.1',
          port: 8500
      }),
      ConsulServiceModule.register({
        serviceId: 'node1',
            serviceName: 'user-service',
            port: 3001,
            consul: {
                discovery_host: 'localhost',
                health_check: {
                    timeout: '1s',
                    interval: '10s',
                },
                max_retry: 5,
                retry_interval: 3000,
            }
      }),
      checks
  ],
})
export class ApplicationModule {}
```

If you use [nest-boot](https://github.com/miaowing/nest-boot) module.

```typescript
import { Module } from '@nestjs/common';
import { ConsulModule } from 'nest-consul';
import { ConsulServiceModule, Check, PASSING, WARNING, FAILURE } from 'nest-consul-service';
import { BootModule, BOOT_ADAPTER } from 'nest-boot';

const checks = [
    (): Check => ({status: PASSING, message: 'ok'}),
    (): Check => ({status: WARNING, message: 'Memory using is high'}), 
    (): Check => ({status: FAILURE, message: 'Refuse service'}),
];

@Module({
  imports: [
      ConsulModule.register({adapter: BOOT_ADAPTER}),
      BootModule.register(__dirname, 'bootstrap.yml'),
      ConsulServiceModule.register({adapter: BOOT_ADAPTER, checks}),
  ],
})
export class ApplicationModule {}
```

#### bootstrap.yml

```yaml
web: 
  serviceId: node1
  serviceName: user-service
  port: 3001
consul:
  host: localhost
  port: 8500
  discovery_host: localhost
  health_check:
    timeout: 1s
    interval: 10s
  # when register / deregister the service to consul fail, it will retry five times.
  max_retry: 5
  retry_interval: 5000
```

#### Consul Service Injection

```typescript
import { Component } from '@nestjs/common';
import { InjectConsulService, ConsulService } from 'nest-consul-service';

@Component()
export class TestService {
  constructor(@InjectConsulService() private readonly service: ConsulService) {}

  getServices() {
      const services = this.service.getServices('user-service', {passing: true});
      this.service.onUpdate('user-service', services => {
          console.log(services);
      });
      console.log(services);
  }
}
```

## Stay in touch

- Author - [Miaowing](https://github.com/miaowing)

## License

  Nest is [MIT licensed](LICENSE).
