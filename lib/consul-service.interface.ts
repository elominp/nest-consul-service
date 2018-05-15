export interface ConsulService {
  getHealthServices(name: string, options: object);
}
