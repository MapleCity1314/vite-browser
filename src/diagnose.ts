import type { ErrorCorrelation } from "./correlate.js";

export type DiagnosisStatus = "pass" | "warn" | "fail";
export type DiagnosisConfidence = "high" | "medium" | "low";

export type DiagnosisResult = {
  code: "circular-dependency" | "missing-module" | "hmr-websocket-closed" | "repeated-full-reload";
  status: DiagnosisStatus;
  confidence: DiagnosisConfidence;
  summary: string;
  detail: string;
  suggestion: string;
};

export type DiagnoseInput = {
  errorText: string;
  runtimeText: string;
  hmrTraceText: string;
  correlation: ErrorCorrelation | null;
};

export function diagnoseHMR(input: DiagnoseInput): DiagnosisResult[] {
  const results = [
    detectCircularDependency(input),
    detectMissingModule(input),
    detectClosedWebsocket(input),
    detectRepeatedFullReload(input),
  ]
    .filter((result): result is DiagnosisResult => result !== null)
    .sort(compareDiagnosisResults);

  if (results.length > 0) return results;

  return [
    {
      code: "hmr-websocket-closed",
      status: "pass",
      confidence: "low",
      summary: "No obvious HMR failure pattern detected",
      detail: "Runtime, current error text, and HMR trace did not match any built-in failure rules.",
      suggestion: "If symptoms persist, inspect `vite hmr trace`, `network`, and `correlate errors` output together.",
    },
  ];
}

export function formatDiagnosisReport(results: DiagnosisResult[]): string {
  const lines = ["# HMR Diagnosis", ""];
  for (const result of results) {
    lines.push(
      `## ${result.code}`,
      `Status: ${result.status}`,
      `Confidence: ${result.confidence}`,
      result.summary,
      result.detail,
      `Suggestion: ${result.suggestion}`,
      "",
    );
  }
  return lines.join("\n").trimEnd();
}

function detectCircularDependency(input: DiagnoseInput): DiagnosisResult | null {
  const text = `${input.errorText}\n${input.hmrTraceText}`;
  if (!/circular (dependency|import)|import cycle/i.test(text)) return null;

  const moduleText =
    input.correlation?.matchingModules.length
      ? `Likely modules: ${input.correlation.matchingModules.join(", ")}.`
      : "The error text points to a circular import/dependency chain.";

  return {
    code: "circular-dependency",
    status: "fail",
    confidence: input.correlation?.matchingModules.length ? "high" : "medium",
    summary: "HMR is likely breaking because of a circular dependency.",
    detail: `${moduleText} Circular imports often prevent safe hot replacement and force stale state or reload loops.`,
    suggestion: "Break the import cycle by extracting shared code into a leaf module or switching one edge to a lazy import.",
  };
}

function detectMissingModule(input: DiagnoseInput): DiagnosisResult | null {
  const text = input.errorText;
  if (!/failed to resolve import|cannot find module|could not resolve|does the file exist/i.test(text)) {
    return null;
  }

  return {
    code: "missing-module",
    status: "fail",
    confidence: "high",
    summary: "A module import failed to resolve during HMR.",
    detail:
      input.correlation?.matchingModules.length
        ? `The current error overlaps with recent updates to ${input.correlation.matchingModules.join(", ")}.`
        : "The current error text matches a missing or unresolved import pattern.",
    suggestion: "Verify the import path, file extension, alias configuration, and whether the module exists on disk.",
  };
}

function detectClosedWebsocket(input: DiagnoseInput): DiagnosisResult | null {
  const runtimeState = extractRuntimeSocketState(input.runtimeText);
  const runtimeClosed = runtimeState === "closed" || runtimeState === "closing";
  const traceClosed = /disconnected|failed to connect|connection lost|ws closed/i.test(input.hmrTraceText);
  if (!runtimeClosed && !traceClosed) return null;

  const runtimeOnly = runtimeClosed && !traceClosed;
  const traceOnly = traceClosed && !runtimeClosed;

  return {
    code: "hmr-websocket-closed",
    status: "fail",
    confidence: runtimeClosed && traceClosed ? "high" : "medium",
    summary: "The HMR websocket is not healthy.",
    detail: runtimeOnly
      ? "Runtime status reports the HMR socket as closed or closing."
      : traceOnly
        ? "HMR trace contains disconnect or websocket failure messages."
        : "Runtime status and HMR trace both indicate websocket instability.",
    suggestion: "Check the dev server is running, the page is connected to the correct origin, and no proxy/firewall is blocking the websocket.",
  };
}

function detectRepeatedFullReload(input: DiagnoseInput): DiagnosisResult | null {
  const matches = input.hmrTraceText.match(/full-reload|page reload/gi) ?? [];
  if (matches.length < 2) return null;

  return {
    code: "repeated-full-reload",
    status: "warn",
    confidence: matches.length >= 3 ? "high" : "medium",
    summary: "Vite is repeatedly falling back to full page reloads.",
    detail: `Observed ${matches.length} full-reload events in the recent HMR trace.`,
    suggestion: "Check whether the changed module is outside HMR boundaries, introduces side effects, or triggers a circular dependency.",
  };
}

function extractRuntimeSocketState(runtimeText: string): "open" | "closed" | "closing" | "connecting" | "unknown" {
  const match = runtimeText.match(/HMR Socket:\s*(open|closed|closing|connecting|unknown)/i);
  const state = match?.[1]?.toLowerCase();
  if (state === "open" || state === "closed" || state === "closing" || state === "connecting") {
    return state;
  }
  return "unknown";
}

function compareDiagnosisResults(a: DiagnosisResult, b: DiagnosisResult): number {
  return scoreDiagnosis(b) - scoreDiagnosis(a);
}

function scoreDiagnosis(result: DiagnosisResult): number {
  const statusScore = result.status === "fail" ? 30 : result.status === "warn" ? 20 : 10;
  const confidenceScore = result.confidence === "high" ? 3 : result.confidence === "medium" ? 2 : 1;
  return statusScore + confidenceScore;
}
