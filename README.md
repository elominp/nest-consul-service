<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

## Description

A component of [nestcloud](http://github.com/nest-cloud/nestcloud). NestCloud is a nest framework micro-service solution.
  
[中文文档](https://nestcloud.org/solutions/fu-wu-zhu-ce-yu-fa-xian)

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

@Module({
  imports: [
      ConsulModule.register({adapter: BOOT_ADAPTER}),
      BootModule.register(__dirname, 'bootstrap.yml'),
      ConsulServiceModule.register({adapter: BOOT_ADAPTER}),
  ],
})
export class ApplicationModule {}
```

#### Nest-boot config file

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

#### Usage

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

#### Custom health check policy

The health check policy is a function, it will return an object that has status(PASSING, WARNING, CRITICAL) and message.

```typescript
import { Module } from '@nestjs/common';
import { ConsulModule } from 'nest-consul';
import { ConsulServiceModule, PASSING } from 'nest-consul-service';
import { BootModule, BOOT_ADAPTER } from 'nest-boot';
​
@Module({
  imports: [
      ConsulModule.register({adapter: BOOT_ADAPTER}),
      BootModule.register(__dirname, 'bootstrap.yml'),
      ConsulServiceModule.register({
        adapter: BOOT_ADAPTER, 
        checks: [() => {
          return {status: PASSING, message: 'ok'}
        }]
      }),
  ],
})
export class ApplicationModule {}
```

## API

### class ConsulServiceModule

#### static register\(options: RegisterOptions\): DynamicModule

Import nest consul service module.

| field | type | description |
| :--- | :--- | :--- |
| options.adapter | string | if you are using nest-boot module, please set BOOT_ADAPTER |
| options.serviceId | string | the service id |
| options.serviceName | string | the service name |
| options.port | number | the service port |
| options.consul.discoveryHost | string | the discovery ip |
| options.consul.health\_check.timeout | number | the health check timeout, default 1s |
| options.consul.health\_check.interval | number | the health check interval，default 10s |
| options.consul.max\_retry | number | the max retry count when register service fail |
| options.consul.retry\_interval | number | the retry interval when register service fail |
| options.checks | \(\(\)=&gt; Check\)\[\] | custom health check policies |

### class ConsulService

#### getServices\(serviceName: string, options?: object\)

Get available services.


## Stay in touch

- Author - [Miaowing](https://github.com/miaowing)

## License

  Nest is [MIT licensed](LICENSE).
