import type { PropagationTrace } from "./trace.js";

export type PropagationDiagnosis = {
  status: "pass" | "warn" | "fail";
  confidence: "high" | "medium" | "low";
  summary: string;
  detail: string;
  suggestion: string;
};

export function diagnosePropagation(trace: PropagationTrace | null): PropagationDiagnosis {
  if (!trace) {
    return {
      status: "warn",
      confidence: "low",
      summary: "No propagation trace is available yet.",
      detail: "The current event window does not contain render/update events, so propagation reasoning cannot start.",
      suggestion: "Reproduce the issue once, then rerun `vite-browser correlate renders` or `vite-browser diagnose propagation`.",
    };
  }

  if (trace.storeUpdates.length > 0 && trace.renderComponents.length > 0 && trace.errorMessages.length > 0) {
    const changedKeys = trace.changedKeys.length > 0 ? ` Changed keys: ${trace.changedKeys.join(", ")}.` : "";
    return {
      status: "fail",
      confidence: trace.confidence,
      summary: "A plausible store -> render -> error propagation path was found.",
      detail: `Start with store ${trace.storeUpdates[0]}, then inspect ${trace.renderComponents[0]} as the nearest affected component.${changedKeys}`,
      suggestion: "Verify the recent store mutation first, then check whether the affected component or a dependent effect turns that state change into the visible failure.",
    };
  }

  if (trace.sourceModules.length > 0 && trace.renderComponents.length > 0 && trace.errorMessages.length > 0) {
    const storeHint = trace.storeHints.length > 0 ? ` Store hint: ${trace.storeHints[0]}.` : "";
    return {
      status: "fail",
      confidence: trace.confidence,
      summary: "A plausible update -> render -> error propagation path was found.",
      detail: `Start with ${trace.sourceModules[0]}, then inspect ${trace.renderComponents[0]} as the nearest affected component.${storeHint}`,
      suggestion: "Verify the updated source module first, then confirm whether the affected component consumes stale props, store state, or side effects.",
    };
  }

  if (trace.renderComponents.length > 0 && trace.networkUrls.length > 1) {
    return {
      status: "warn",
      confidence: trace.confidence,
      summary: "Render activity overlaps with repeated network work.",
      detail: `Observed render activity around ${trace.networkUrls.length} network request target(s).`,
      suggestion: "Check whether rerenders are retriggering data fetches or invalidating derived state more often than expected.",
    };
  }

  return {
    status: "pass",
    confidence: trace.confidence,
    summary: "Propagation data is present but not yet conclusive.",
    detail: "The current trace shows render activity, but not enough linked source/error evidence for a stronger diagnosis.",
    suggestion: "Use the render correlation output to narrow the likely component path, then inspect source updates and runtime errors together.",
  };
}

export function formatPropagationDiagnosisReport(result: PropagationDiagnosis): string {
  return [
    "# Propagation Diagnosis",
    "",
    `Status: ${result.status}`,
    `Confidence: ${result.confidence}`,
    result.summary,
    result.detail,
    `Suggestion: ${result.suggestion}`,
  ].join("\n");
}
