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
            protocol?: string;
            route?: string;
        };
        max_retry?: number;
        retry_interval?: number;
    };
    logger: boolean | LoggerService;
}

export interface RegisterOptions {
    adapter?: string;
    serviceId?: string;
    serviceName?: string;
    port?: number;
    consul?: {
        discovery_host?: string;
        health_check?: {
            timeout?: string;
            interval?: string;
            protocol?: string;
            route?: string;
            deregistercriticalserviceafter?: string,
        };
        max_retry?: number;
        retry_interval?: number;
    };
    logger?: boolean | LoggerService;
    checks?: (() => Check)[];
}

export interface Check {
    status: string;
    message?: string;
}

export const PASSING = 'passing';

export const WARNING = 'warning';

export const FAILURE = 'failure';
