<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

[travis-image]: https://api.travis-ci.org/nestjs/nest.svg?branch=master
[travis-url]: https://travis-ci.org/nestjs/nest
[linux-image]: https://img.shields.io/travis/nestjs/nest/master.svg?label=linux
[linux-url]: https://travis-ci.org/nestjs/nest
  
  <p align="center">A progressive <a href="http://nodejs.org" target="blank">Node.js</a> framework for building efficient and scalable server-side applications, heavily inspired by <a href="https://angular.io" target="blank">Angular</a>.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore"><img src="https://img.shields.io/npm/dm/@nestjs/core.svg" alt="NPM Downloads" /></a>
<a href="https://travis-ci.org/nestjs/nest"><img src="https://api.travis-ci.org/nestjs/nest.svg?branch=master" alt="Travis" /></a>
<a href="https://travis-ci.org/nestjs/nest"><img src="https://img.shields.io/travis/nestjs/nest/master.svg?label=linux" alt="Linux" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#5" alt="Coverage" /></a>
<a href="https://gitter.im/nestjs/nestjs?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=body_badge"><img src="https://badges.gitter.im/nestjs/nestjs.svg" alt="Gitter" /></a>
<a href="https://opencollective.com/nest#backer"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec"><img src="https://img.shields.io/badge/Donate-PayPal-dc3d53.svg"/></a>
<img src="https://img.shields.io/badge/👌-Production Ready-78c7ff.svg"/>
  <a href="https://twitter.com/nestframework"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

This is a [Nest](https://github.com/nestjs/nest) module for registering and getting consul service easily.

## Installation

```bash
$ npm i --save nest-consul-service nest-consul
```

## Quick Start

#### Import Module

```typescript
import { Module } from '@nestjs/common';
import { ConsulModule } from 'nest-consul';
import { ConsulServiceModule } from 'nest-consul-service';

@Module({
  imports: [
      ConsulModule.forRoot({
        host: '127.0.0.1',
        port: 8500
      }),
      ConsulServiceModule({
        web: {
            serviceId: 'node1',
            serviceName: 'user-service',
            port: '3001'
        },
        consul: {
            discoveryHost: 'localhost',
            check: {
                timeout: '1s',
                interval: '10s'
            },
            retry: {
                max: 5,
                interval: 3000
            }
        }
      })
  ],
})
export class ApplicationModule {}
```

If you use [nest-boot](https://github.com/miaowing/nest-boot) module.

```typescript
import { Module } from '@nestjs/common';
import { ConsulModule } from 'nest-consul';
import { ConsulServiceModule } from 'nest-consul-service';
import { BootModule } from 'nest-boot';

@Module({
  imports: [
      ConsulModule.forRoot({
        host: '127.0.0.1',
        port: 8500
      }),
      BootModule.forRoot(__dirname, 'bootstrap.yml'),
      ConsulServiceModule.forRoot({
        web: {
            serviceId: 'node1',
            serviceName: 'user-service',
            port: '3001'
        },
        consul: {
            discoveryHost: 'localhost',
            check: {
                timeout: '1s',
                interval: '10s'
            },
            retry: {
                max: 5,
                interval: 3000
            }
        }
      })
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
  discoveryHost: localhost
  check:
    timeout: 1s
    interval: 10s
  retry:
    # when register / deregister the service to consul fail, it will retry five times.
    max: 5
    interval: 5000
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
      console.log(services);
  }
}
```

## Stay in touch

- Author - [Miaowing](https://github.com/miaowing)

## License

  Nest is [MIT licensed](LICENSE).