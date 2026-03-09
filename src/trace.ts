import type { VBEvent } from "./event-queue.js";

type EventPayload = Record<string, unknown>;

export type PropagationTrace = {
  summary: string;
  confidence: "high" | "medium" | "low";
  sourceModules: string[];
  storeUpdates: string[];
  changedKeys: string[];
  renderComponents: string[];
  storeHints: string[];
  networkUrls: string[];
  errorMessages: string[];
  events: VBEvent[];
};

const MODULE_PATTERNS = [
  /\/src\/[^\s"'`):]+/g,
  /\/@fs\/[^\s"'`):]+/g,
  /[A-Za-z]:\\[^:\n]+/g,
];

export function correlateRenderPropagation(events: VBEvent[]): PropagationTrace | null {
  const recent = events.slice().sort((a, b) => a.timestamp - b.timestamp);
  const renderEvents = recent.filter((event) => event.type === "render");
  if (renderEvents.length === 0) return null;

  const hmrEvents = recent.filter((event) => event.type === "hmr-update" || event.type === "hmr-error");
  const storeEvents = recent.filter((event) => event.type === "store-update");
  const networkEvents = recent.filter((event) => event.type === "network");
  const errorEvents = recent.filter((event) => event.type === "error");

  const sourceModules = unique(hmrEvents.flatMap(extractModulesFromEvent));
  const storeUpdates = unique(
    storeEvents
      .map((event) => (event.payload as EventPayload).store)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );
  const changedKeys = unique(
    storeEvents.flatMap((event) => {
      const keys = (event.payload as EventPayload).changedKeys;
      return Array.isArray(keys)
        ? keys.filter((value): value is string => typeof value === "string" && value.length > 0)
        : [];
    }),
  );
  const renderComponents = unique(renderEvents.map(extractComponentLabel).filter(Boolean));
  const storeHints = unique(
    renderEvents.flatMap((event) => {
      const hints = (event.payload as EventPayload).storeHints;
      return Array.isArray(hints)
        ? hints.filter((value): value is string => typeof value === "string" && value.length > 0)
        : [];
    }),
  );
  const networkUrls = unique(
    networkEvents
      .map((event) => (event.payload as EventPayload).url)
      .filter((value): value is string => typeof value === "string"),
  );
  const errorMessages = unique(
    errorEvents
      .map((event) => (event.payload as EventPayload).message)
      .filter((value): value is string => typeof value === "string" && value.length > 0),
  );

  const confidence = inferConfidence(sourceModules, storeUpdates, renderComponents, errorMessages);
  const eventCount = hmrEvents.length + storeEvents.length + renderEvents.length + networkEvents.length + errorEvents.length;

  return {
    summary:
      sourceModules.length > 0 || storeUpdates.length > 0
        ? `Recent source/store updates likely propagated through ${renderComponents.length || 1} render step(s).`
        : `Render activity observed${errorMessages.length > 0 ? " near the current failure" : ""}.`,
    confidence,
    sourceModules,
    storeUpdates,
    changedKeys,
    renderComponents,
    storeHints,
    networkUrls,
    errorMessages,
    events: recent.slice(-Math.max(eventCount, 1)),
  };
}

export function formatPropagationTraceReport(trace: PropagationTrace | null): string {
  const lines = ["# Render Correlation"];
  if (!trace) {
    lines.push("", "No render/update events available in the current event window.");
    return lines.join("\n");
  }

  lines.push("", `Confidence: ${trace.confidence}`, trace.summary, "");
  lines.push("## Source Updates");
  lines.push(...formatList(trace.sourceModules));

  if (trace.storeUpdates.length > 0) {
    lines.push("", "## Store Updates", ...formatList(trace.storeUpdates));
  }

  if (trace.changedKeys.length > 0) {
    lines.push("", "## Changed Keys", ...formatList(trace.changedKeys));
  }

  lines.push("");
  lines.push("## Render Path");
  lines.push(...formatList(trace.renderComponents));

  if (trace.storeHints.length > 0) {
    lines.push("", "## Store Hints", ...formatList(trace.storeHints));
  }

  if (trace.networkUrls.length > 0) {
    lines.push("", "## Network Activity", ...formatList(trace.networkUrls));
  }

  if (trace.errorMessages.length > 0) {
    lines.push("", "## Errors", ...formatList(trace.errorMessages));
  }

  return lines.join("\n");
}

function inferConfidence(
  sourceModules: string[],
  storeUpdates: string[],
  renderComponents: string[],
  errorMessages: string[],
): "high" | "medium" | "low" {
  if ((sourceModules.length > 0 || storeUpdates.length > 0) && renderComponents.length > 0 && errorMessages.length > 0) return "high";
  if (renderComponents.length > 0 && (sourceModules.length > 0 || storeUpdates.length > 0 || errorMessages.length > 0)) return "medium";
  return "low";
}

function extractModulesFromEvent(event: VBEvent): string[] {
  const payload = event.payload as EventPayload;
  const candidates: string[] = [];
  if (typeof payload.path === "string") candidates.push(payload.path);
  if (typeof payload.message === "string") candidates.push(payload.message);
  if (Array.isArray(payload.updates)) {
    for (const update of payload.updates) {
      if (update && typeof update === "object" && typeof (update as EventPayload).path === "string") {
        candidates.push((update as EventPayload).path as string);
      }
    }
  }
  return unique(candidates.flatMap(extractModules));
}

function extractModules(text: string): string[] {
  const matches = MODULE_PATTERNS.flatMap((pattern) => text.match(pattern) ?? []);
  return unique(matches.map((value) => value.replace(/[),.:]+$/, "")));
}

function extractComponentLabel(event: VBEvent): string {
  const payload = event.payload as EventPayload;
  const component = payload.component;
  const path = payload.path;
  if (typeof path === "string" && path.length > 0) return path;
  if (typeof component === "string" && component.length > 0) return component;
  return "anonymous-render";
}

function formatList(values: string[]): string[] {
  if (values.length === 0) return ["(none)"];
  return values.map((value) => `- ${value}`);
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
