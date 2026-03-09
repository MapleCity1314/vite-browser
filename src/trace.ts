import {
  extractModulesFromHmrEvent,
  getChangedKeys,
  getErrorEvents,
  getErrorMessage,
  getHmrEvents,
  getNetworkEvents,
  getNetworkUrl,
  getRenderEvents,
  getRenderLabel,
  getStoreHints,
  getStoreName,
  getStoreUpdateEvents,
  sortEventsChronologically,
  uniqueStrings,
} from "./event-analysis.js";
import type { VBEvent } from "./event-queue.js";

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

export function correlateRenderPropagation(events: VBEvent[]): PropagationTrace | null {
  const recent = sortEventsChronologically(events);
  const renderEvents = getRenderEvents(recent);
  if (renderEvents.length === 0) return null;

  const hmrEvents = getHmrEvents(recent);
  const storeEvents = getStoreUpdateEvents(recent);
  const networkEvents = getNetworkEvents(recent);
  const errorEvents = getErrorEvents(recent);

  const sourceModules = uniqueStrings(hmrEvents.flatMap(extractModulesFromHmrEvent));
  const storeUpdates = uniqueStrings(
    storeEvents.map((event) => getStoreName(event.payload)).filter((value): value is string => value != null),
  );
  const changedKeys = uniqueStrings(
    storeEvents.flatMap((event) => getChangedKeys(event.payload)),
  );
  const renderComponents = uniqueStrings(renderEvents.map((event) => getRenderLabel(event.payload)).filter(Boolean));
  const storeHints = uniqueStrings(
    renderEvents.flatMap((event) => getStoreHints(event.payload)),
  );
  const networkUrls = uniqueStrings(
    networkEvents.map((event) => getNetworkUrl(event.payload)).filter((value): value is string => value != null),
  );
  const errorMessages = uniqueStrings(
    errorEvents.map((event) => getErrorMessage(event.payload)).filter((value): value is string => value != null),
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

function formatList(values: string[]): string[] {
  if (values.length === 0) return ["(none)"];
  return values.map((value) => `- ${value}`);
}
