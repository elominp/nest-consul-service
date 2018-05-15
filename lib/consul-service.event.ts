import * as EventEmitter from 'events';

class ConsulServiceEvent extends EventEmitter {}

export class Event {
  private static event = new ConsulServiceEvent();

  static on(eventName: string, callback: (service: object) => void) {
    Event.event.on(eventName, callback);
  }

  static emit(eventName, ...params) {
    Event.event.emit(eventName, ...params);
  }
}
