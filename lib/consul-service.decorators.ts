import { Inject } from '@nestjs/common';
import { CONSUL_SERVICE_CHECKS_PROVIDER, CONSUL_SERVICE_PROVIDER } from "./constants";

export const InjectConsulService = () => Inject(CONSUL_SERVICE_PROVIDER);

export const InjectHealthChecks = () => Inject(CONSUL_SERVICE_CHECKS_PROVIDER);
