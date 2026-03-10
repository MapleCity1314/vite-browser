import type {
  ErrorEventPayload,
  HmrEventPayload,
  NetworkEventPayload,
  RenderEventPayload,
  StoreUpdatePayload,
  VBEvent,
} from "./event-queue.js";

const MODULE_PATTERNS = [
  /\/src\/[^\s"'`):]+/g,
  /\/@fs\/[^\s"'`)]+/g,
  /[A-Za-z]:\\[^:\n]+/g,
];

export type HmrVBEvent = Extract<VBEvent, { type: "hmr-update" | "hmr-error" }>;
export type RenderVBEvent = Extract<VBEvent, { type: "render" }>;
export type StoreUpdateVBEvent = Extract<VBEvent, { type: "store-update" }>;
export type NetworkVBEvent = Extract<VBEvent, { type: "network" }>;
export type ErrorVBEvent = Extract<VBEvent, { type: "error" }>;

export function sortEventsChronologically(events: VBEvent[]): VBEvent[] {
  return events.slice().sort((left, right) => left.timestamp - right.timestamp);
}

export function getHmrEvents(events: VBEvent[]): HmrVBEvent[] {
  return events.filter((event): event is HmrVBEvent => event.type === "hmr-update" || event.type === "hmr-error");
}

export function getRenderEvents(events: VBEvent[]): RenderVBEvent[] {
  return events.filter((event): event is RenderVBEvent => event.type === "render");
}

export function getStoreUpdateEvents(events: VBEvent[]): StoreUpdateVBEvent[] {
  return events.filter((event): event is StoreUpdateVBEvent => event.type === "store-update");
}

export function getNetworkEvents(events: VBEvent[]): NetworkVBEvent[] {
  return events.filter((event): event is NetworkVBEvent => event.type === "network");
}

export function getErrorEvents(events: VBEvent[]): ErrorVBEvent[] {
  return events.filter((event): event is ErrorVBEvent => event.type === "error");
}

export function extractModules(text: string): string[] {
  const matches = MODULE_PATTERNS.flatMap((pattern) => text.match(pattern) ?? []);
  return uniqueStrings(matches.map(normalizeModulePath).filter(Boolean));
}

export function extractModulesFromHmrPayload(payload: HmrEventPayload): string[] {
  const candidates: string[] = [];
  if (typeof payload.path === "string") candidates.push(payload.path);
  if (typeof payload.message === "string") candidates.push(payload.message);
  if (Array.isArray(payload.updates)) {
    for (const update of payload.updates) {
      if (typeof update?.path === "string") {
        candidates.push(update.path);
      }
    }
  }
  return uniqueStrings(candidates.flatMap(extractModules));
}

export function extractModulesFromHmrEvent(event: HmrVBEvent): string[] {
  return extractModulesFromHmrPayload(event.payload);
}

export function getRenderLabel(payload: RenderEventPayload): string {
  if (payload.path.length > 0) return payload.path;
  if (payload.component.length > 0) return payload.component;
  return "anonymous-render";
}

export function getStoreName(payload: StoreUpdatePayload): string | null {
  return payload.store.length > 0 ? payload.store : null;
}

export function getChangedKeys(payload: StoreUpdatePayload): string[] {
  return payload.changedKeys.filter((value) => value.length > 0);
}

export function getStoreHints(payload: RenderEventPayload): string[] {
  return payload.storeHints.filter((value) => value.length > 0);
}

export function getRenderReason(payload: RenderEventPayload): string | null {
  return typeof payload.reason === "string" && payload.reason.length > 0 ? payload.reason : null;
}

export function getRenderChangedKeys(payload: RenderEventPayload): string[] {
  return payload.changedKeys.filter((value) => value.length > 0);
}

export function getNetworkUrl(payload: NetworkEventPayload): string | null {
  return payload.url.length > 0 ? payload.url : null;
}

export function getErrorMessage(payload: ErrorEventPayload): string | null {
  return typeof payload.message === "string" && payload.message.length > 0 ? payload.message : null;
}

export function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function normalizeModulePath(value: string): string {
  return value
    .replace(/:\d+:\d+$/, "")
    .replace(/[),.:]+$/, "");
}
