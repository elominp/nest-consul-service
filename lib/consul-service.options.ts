export interface Options {
  web: WebOptions;
  consul: ConsulOptions;
}

export interface WebOptions {
  serverId?: string;
  serviceName: string;
  port: number;
}

export interface ConsulOptions {
  discoveryHost?: string;
  check: CheckOptions;
}

export interface CheckOptions {
  timeout?: string;
  interval?: string;
  retry?: RetryOptions;
}

export interface RetryOptions {
  max?: number;
  interval?: number;
}
