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

    // Maintain sorted order by timestamp.  Events almost always arrive
    // in order, so the fast path (no swap) costs a single comparison.
    const len = this.events.length;
    if (len >= 2 && this.events[len - 1].timestamp < this.events[len - 2].timestamp) {
      this._insertionSort(len - 1);
    }
  }

  /** Bubble the element at `idx` leftward to restore sorted order. */
  private _insertionSort(idx: number): void {
    const events = this.events;
    const item = events[idx];
    let j = idx - 1;
    while (j >= 0 && events[j].timestamp > item.timestamp) {
      events[j + 1] = events[j];
      j--;
    }
    events[j + 1] = item;
  }

  /**
   * Return all events within the last `ms` milliseconds before `before`.
   *
   * Uses binary search to find the start index (O(log n)) then slices,
   * which is significantly faster than a full linear scan for large queues.
   * Events are maintained in insertion order, which for timestamped pushes
   * is monotonically non-decreasing.
   */
  window(ms: number, before = Date.now()): VBEvent[] {
    const start = before - ms;
    const events = this.events;
    const len = events.length;
    if (len === 0) return [];

    // Binary search for the first event with timestamp >= start
    let lo = 0;
    let hi = len;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (events[mid].timestamp < start) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    // Linear scan from lo for events <= before
    // (in practice, `before` is usually Date.now() so most events qualify)
    const result: VBEvent[] = [];
    for (let i = lo; i < len; i++) {
      if (events[i].timestamp > before) break;
      result.push(events[i]);
    }
    return result;
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

  /** Number of events currently stored */
  get size(): number {
    return this.events.length;
  }

  clear(): void {
    this.events = [];
  }
}
