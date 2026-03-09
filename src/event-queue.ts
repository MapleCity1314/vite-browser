export type HmrEventPayload = {
  type?: string;
  path?: string;
  message?: string;
  updates?: Array<{ path?: string }>;
  [key: string]: unknown;
};

export type StoreUpdatePayload = {
  store: string;
  mutationType: string;
  events: number;
  changedKeys: string[];
};

export type NetworkEventPayload = {
  url: string;
  method?: string;
  status?: number;
  ms?: number;
};

export type ErrorEventPayload = {
  message?: string;
  source?: string | null;
  line?: number | null;
  col?: number | null;
  stack?: string;
};

export type RenderEventPayload = {
  component: string;
  path: string;
  framework: "vue" | "react" | "svelte" | "unknown";
  reason: string;
  mutationCount: number;
  storeHints: string[];
  changedKeys: string[];
};

export type ModuleChangePayload = {
  path?: string;
  [key: string]: unknown;
};

export type VBEvent =
  | { timestamp: number; type: "hmr-update"; payload: HmrEventPayload }
  | { timestamp: number; type: "hmr-error"; payload: HmrEventPayload }
  | { timestamp: number; type: "module-change"; payload: ModuleChangePayload }
  | { timestamp: number; type: "store-update"; payload: StoreUpdatePayload }
  | { timestamp: number; type: "network"; payload: NetworkEventPayload }
  | { timestamp: number; type: "error"; payload: ErrorEventPayload }
  | { timestamp: number; type: "render"; payload: RenderEventPayload };

export type VBEventType = VBEvent["type"];

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
