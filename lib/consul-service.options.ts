import { LoggerService } from '@nestjs/common';

export interface Options {
  web: {
    serviceId?: string;
    serviceName: string;
    port: number;
  };
  consul: {
    discovery_host?: string;
    health_check?: {
      timeout?: string;
      interval?: string;
      max_retry?: number;
      retry_interval?: number;
    };
  };
  logger: boolean | LoggerService;
}

export interface RegisterOptions {
  serviceId?: string;
  serviceName: string;
  port: number;
  consul: {
    discovery_host?: string;
    health_check?: {
      timeout?: string;
      interval?: string;
      max_retry?: number;
      retry_interval?: number;
    };
  };
  logger?: boolean | LoggerService;
  checks?: (() => Check)[];
}

export interface RegisterBootOptions {
  logger?: boolean | LoggerService;
  checks?: (() => Check)[];
}

export interface Check {
  status: string;
  message?: string;
}

export const PASSWING = 'passwing';

export const WARNING = 'warning';

export const FAILURE = 'failure';
