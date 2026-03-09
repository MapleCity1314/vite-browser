export type VBEventType =
  | 'hmr-update'
  | 'hmr-error'
  | 'module-change'
  | 'network'
  | 'error'
  | 'render';

export interface VBEvent {
  timestamp: number;
  type: VBEventType;
  payload: unknown;
}

export class EventQueue {
  private events: VBEvent[] = [];
  private readonly maxSize: number;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
  }

  push(event: VBEvent): void {
    this.events.push(event);
    if (this.events.length > this.maxSize) {
      this.events.shift();
    }
  }

  /**
   * Return all events within the last `ms` milliseconds before `before`
   */
  window(ms: number, before = Date.now()): VBEvent[] {
    const start = before - ms;
    return this.events.filter(
      (e) => e.timestamp >= start && e.timestamp <= before
    );
  }

  /**
   * Return all events of a given type
   */
  ofType(type: VBEventType): VBEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  all(): VBEvent[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}
