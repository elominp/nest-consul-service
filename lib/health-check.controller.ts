import { Controller, Get, Res } from '@nestjs/common';
import { InjectHealthChecks } from './consul-service.decorators';
import { Check, PASSING, WARNING, FAILURE } from './consul-service.options';

@Controller('/health')
export class HealthController {
  constructor(@InjectHealthChecks() private readonly checks: (() => Check)[]) {}

  @Get()
  async check(@Res() res) {
    const checks = this.checks.filter(check => typeof check === 'function');
    const message = { passing: [], warning: [], failure: [] };
    try {
      for (let i = 0; i < checks.length; i++) {
        const result = (await this.do(checks[i]())) as Check;
        switch (result.status) {
          case PASSING:
            message.passing.push(status);
            break;
          case WARNING:
            message.warning.push(status);
            break;
          case FAILURE:
            message.failure.push(status);
            break;
          default:
            message.passing.push(status);
        }
      }
    } catch (e) {
      return res.status(500).json({ messages: [e.message] });
    }
    res
      .status(message.failure.length ? 500 : message.warning.length ? 429 : 200)
      .json({ message });
  }

  private async do(invoked) {
    if (invoked instanceof Promise) {
      return await invoked;
    }
    return invoked;
  }
}
