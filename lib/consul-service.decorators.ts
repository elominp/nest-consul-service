import { Inject } from '@nestjs/common';

export const InjectConsulService = () => Inject('ConsulService');

export const InjectHealthChecks = () => Inject('ConsulServiceHealthChecks');
