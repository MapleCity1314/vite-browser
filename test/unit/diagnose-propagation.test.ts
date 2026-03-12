import { describe, expect, it } from "vitest";
import { diagnosePropagation, formatPropagationDiagnosisReport } from "../../src/diagnose-propagation.js";

describe("diagnosePropagation", () => {
  it("returns a fail result for a plausible update-render-error chain", () => {
    const result = diagnosePropagation({
      summary: "Recent source updates likely propagated through 1 render step(s).",
      confidence: "high",
      sourceModules: ["/src/App.vue"],
      storeUpdates: [],
      changedKeys: [],
      renderComponents: ["AppShell > Dashboard"],
      storeHints: ["main"],
      networkUrls: ["/api/items"],
      errorMessages: ["TypeError: boom"],
      events: [],
    });

    expect(result).toMatchObject({
      status: "fail",
      confidence: "high",
    });
    expect(result.detail).toContain("Store hint: main.");
  });

  it("prefers store propagation when a concrete store update is present", () => {
    const result = diagnosePropagation({
      summary: "Recent source/store updates likely propagated through 1 render step(s).",
      confidence: "high",
      sourceModules: [],
      storeUpdates: ["main"],
      changedKeys: ["filters", "sort"],
      renderComponents: ["AppShell > Dashboard"],
      storeHints: ["main"],
      networkUrls: [],
      errorMessages: ["TypeError: boom"],
      events: [],
    });

    expect(result).toMatchObject({
      status: "fail",
      summary: "A plausible store -> render -> error propagation path was found.",
    });
    expect(result.detail).toContain("store main");
    expect(result.detail).toContain("Changed keys: filters, sort.");
  });

  it("formats fallback output when no trace exists", () => {
    const report = formatPropagationDiagnosisReport(diagnosePropagation(null));
    expect(report).toContain("# Propagation Diagnosis");
    expect(report).toContain("No propagation trace is available yet.");
  });
});
