import type { VBEvent } from "./event-queue.js";

export type CorrelationConfidence = "high" | "medium" | "low";

export type ErrorCorrelation = {
  summary: string;
  detail: string;
  confidence: CorrelationConfidence;
  windowMs: number;
  matchingModules: string[];
  relatedEvents: VBEvent[];
};

export type RenderNetworkCorrelation = {
  summary: string;
  detail: string;
  confidence: CorrelationConfidence;
  requestCount: number;
  urls: string[];
};

type EventPayload = Record<string, unknown>;

const MODULE_PATTERNS = [
  /\/src\/[^\s"'`):]+/g,
  /\/@fs\/[^\s"'`):]+/g,
  /[A-Za-z]:\\[^:\n]+/g,
];

export function correlateErrorWithHMR(
  errorText: string,
  events: VBEvent[],
  windowMs = 5000,
): ErrorCorrelation | null {
  const recentEvents = events.filter((event) => event.type === "hmr-update" || event.type === "hmr-error");
  if (recentEvents.length === 0) return null;

  const errorModules = extractModules(errorText);
  const matchedEvents = recentEvents.filter((event) => {
    const modules = extractModulesFromEvent(event);
    if (errorModules.length === 0) return event.type === "hmr-error";
    return modules.some((module) => errorModules.includes(module));
  });

  const relatedEvents = matchedEvents.length > 0 ? matchedEvents : recentEvents;
  const matchingModules = unique(
    relatedEvents.flatMap((event) => extractModulesFromEvent(event)).filter((module) => errorModules.includes(module)),
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
  const renderEvents = events.filter((event) => event.type === "render");
  const networkEvents = events.filter((event) => event.type === "network");
  if (renderEvents.length === 0 || networkEvents.length === 0) return null;

  const latestRender = renderEvents[renderEvents.length - 1];
  const start = latestRender.timestamp - 1000;
  const end = latestRender.timestamp + 1000;
  const overlappingNetwork = networkEvents.filter(
    (event) => event.timestamp >= start && event.timestamp <= end,
  );
  const urls = unique(
    overlappingNetwork
      .map((event) => (event.payload as EventPayload).url)
      .filter((url): url is string => typeof url === "string"),
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

function formatEventLine(event: VBEvent): string {
  const payload = event.payload as EventPayload;
  const path = payload.path;
  const message = payload.message;
  if (typeof path === "string") return `- ${event.type}: ${path}`;
  if (typeof message === "string") return `- ${event.type}: ${message}`;
  return `- ${event.type}: ${JSON.stringify(payload)}`;
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
  return unique(candidates.flatMap((candidate) => extractModules(candidate)));
}

function extractModules(text: string): string[] {
  const matches = MODULE_PATTERNS.flatMap((pattern) => text.match(pattern) ?? []);
  return unique(matches.map(normalizeModulePath).filter(Boolean));
}

function normalizeModulePath(value: string): string {
  return value.replace(/[),.:]+$/, "");
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
