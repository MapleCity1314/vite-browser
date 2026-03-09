import {
  extractModules,
  extractModulesFromHmrEvent,
  getHmrEvents,
  getNetworkEvents,
  getRenderEvents,
  uniqueStrings,
  type HmrVBEvent,
} from "./event-analysis.js";
import type { VBEvent } from "./event-queue.js";

export type CorrelationConfidence = "high" | "medium" | "low";

export type ErrorCorrelation = {
  summary: string;
  detail: string;
  confidence: CorrelationConfidence;
  windowMs: number;
  matchingModules: string[];
  relatedEvents: HmrVBEvent[];
};

export type RenderNetworkCorrelation = {
  summary: string;
  detail: string;
  confidence: CorrelationConfidence;
  requestCount: number;
  urls: string[];
};

export function correlateErrorWithHMR(
  errorText: string,
  events: VBEvent[],
  windowMs = 5000,
): ErrorCorrelation | null {
  const recentEvents = getHmrEvents(events);
  if (recentEvents.length === 0) return null;

  const errorModules = extractModules(errorText);
  const matchedEvents = recentEvents.filter((event) => {
    const modules = extractModulesFromHmrEvent(event);
    if (errorModules.length === 0) return event.type === "hmr-error";
    return modules.some((module) => errorModules.includes(module));
  });

  const relatedEvents = matchedEvents.length > 0 ? matchedEvents : recentEvents;
  const matchingModules = uniqueStrings(
    relatedEvents.flatMap((event) => extractModulesFromHmrEvent(event)).filter((module) => errorModules.includes(module)),
  );

  const confidence = inferConfidence(errorModules, matchingModules, relatedEvents);
  const eventKind = relatedEvents.some((event) => event.type === "hmr-error") ? "HMR error" : "HMR update";
  const moduleText =
    matchingModules.length > 0
      ? `Matching modules: ${matchingModules.join(", ")}`
      : errorModules.length > 0
        ? `Error modules: ${errorModules.join(", ")}`
        : "No module path overlap; correlation is time-window based.";

  return {
    summary: `${eventKind} observed within ${windowMs}ms of the current error`,
    detail: `${moduleText}\nRecent events considered: ${relatedEvents.length}`,
    confidence,
    windowMs,
    matchingModules,
    relatedEvents,
  };
}

export function correlateRenderWithNetwork(events: VBEvent[], requestThreshold = 3): RenderNetworkCorrelation | null {
  const renderEvents = getRenderEvents(events);
  const networkEvents = getNetworkEvents(events);
  if (renderEvents.length === 0 || networkEvents.length === 0) return null;

  const latestRender = renderEvents[renderEvents.length - 1];
  const start = latestRender.timestamp - 1000;
  const end = latestRender.timestamp + 1000;
  const overlappingNetwork = networkEvents.filter(
    (event) => event.timestamp >= start && event.timestamp <= end,
  );
  const urls = uniqueStrings(
    overlappingNetwork
      .map((event) => event.payload.url)
      .filter((url) => typeof url === "string" && url.length > 0),
  );

  if (overlappingNetwork.length < requestThreshold) return null;

  return {
    summary: "Repeated network activity detected around a render event",
    detail: `Observed ${overlappingNetwork.length} network requests near the latest render. URLs: ${urls.join(", ")}`,
    confidence: overlappingNetwork.length >= requestThreshold + 2 ? "high" : "medium",
    requestCount: overlappingNetwork.length,
    urls,
  };
}

export function formatErrorCorrelationReport(errorText: string, correlation: ErrorCorrelation | null): string {
  const lines = ["# Error Correlation", "", "## Current Error", errorText.trim() || "(empty error)"];

  if (!correlation) {
    lines.push("", "## Correlation", "No recent HMR events correlated with the current error.");
    return lines.join("\n");
  }

  lines.push(
    "",
    "## Correlation",
    `Confidence: ${correlation.confidence}`,
    correlation.summary,
    correlation.detail,
    "",
    "## Related Events",
    ...correlation.relatedEvents.map((event) => formatEventLine(event)),
  );
  return lines.join("\n");
}

function formatEventLine(event: HmrVBEvent): string {
  const path = event.payload.path;
  const message = event.payload.message;
  if (typeof path === "string") return `- ${event.type}: ${path}`;
  if (typeof message === "string") return `- ${event.type}: ${message}`;
  return `- ${event.type}: ${JSON.stringify(event.payload)}`;
}

function inferConfidence(
  errorModules: string[],
  matchingModules: string[],
  events: VBEvent[],
): CorrelationConfidence {
  if (matchingModules.length > 0) return "high";
  if (events.some((event) => event.type === "hmr-error")) return "medium";
  if (errorModules.length === 0 && events.length > 0) return "low";
  return "medium";
}
