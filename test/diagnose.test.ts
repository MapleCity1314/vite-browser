import { describe, expect, it } from "vitest";
import { diagnoseHMR, formatDiagnosisReport } from "../src/diagnose.js";

describe("diagnoseHMR", () => {
  it("detects missing module errors", () => {
    const results = diagnoseHMR({
      errorText: "Failed to resolve import '/src/missing.ts' from '/src/App.tsx'. Does the file exist?",
      runtimeText: "# Vite Runtime\nHMR Socket: open",
      hmrTraceText: "# HMR Trace",
      correlation: {
        summary: "HMR update observed",
        detail: "Matching modules: /src/App.tsx",
        confidence: "high",
        windowMs: 5000,
        matchingModules: ["/src/App.tsx"],
        relatedEvents: [],
      },
    });

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "missing-module",
          status: "fail",
          confidence: "high",
        }),
      ]),
    );
  });

  it("detects websocket closure and repeated full reloads", () => {
    const results = diagnoseHMR({
      errorText: "no errors",
      runtimeText: "# Vite Runtime\nHMR Socket: closed",
      hmrTraceText: "# HMR Trace\n[12:00:00] error disconnected\n[12:00:01] full-reload /src/App.tsx\n[12:00:02] full-reload /src/main.tsx",
      correlation: null,
    });

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "hmr-websocket-closed", status: "fail" }),
        expect.objectContaining({ code: "repeated-full-reload", status: "warn" }),
      ]),
    );
  });

  it("does not flag websocket issues when runtime is healthy", () => {
    const results = diagnoseHMR({
      errorText: "ReferenceError: boom",
      runtimeText: "# Vite Runtime\nHMR Socket: open",
      hmrTraceText: "# HMR Trace\n[12:00:00] connected",
      correlation: null,
    });

    expect(results).toEqual([
      expect.objectContaining({
        code: "hmr-websocket-closed",
        status: "pass",
        confidence: "low",
      }),
    ]);
  });

  it("keeps websocket diagnosis when trace shows disconnect even if runtime snapshot is ambiguous", () => {
    const results = diagnoseHMR({
      errorText: "no errors",
      runtimeText: "# Vite Runtime\nHMR Socket: unknown",
      hmrTraceText: "# HMR Trace\n[12:00:00] error disconnected",
      correlation: null,
    });

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "hmr-websocket-closed",
          status: "fail",
          confidence: "medium",
        }),
      ]),
    );
  });

  it("prioritizes fail results ahead of warnings in the formatted report", () => {
    const report = formatDiagnosisReport(
      diagnoseHMR({
        errorText: "Failed to resolve import '/src/missing.ts' from '/src/App.tsx'. Does the file exist?",
        runtimeText: "# Vite Runtime\nHMR Socket: closed",
        hmrTraceText:
          "# HMR Trace\n[12:00:00] error disconnected\n[12:00:01] full-reload /src/App.tsx\n[12:00:02] full-reload /src/main.tsx",
        correlation: {
          summary: "HMR update observed",
          detail: "Matching modules: /src/App.tsx",
          confidence: "high",
          windowMs: 5000,
          matchingModules: ["/src/App.tsx"],
          relatedEvents: [],
        },
      }),
    );

    expect(report.indexOf("## missing-module")).toBeLessThan(report.indexOf("## repeated-full-reload"));
  });

  it("formats diagnosis report", () => {
    const report = formatDiagnosisReport([
      {
        code: "circular-dependency",
        status: "fail",
        confidence: "medium",
        summary: "cycle detected",
        detail: "details",
        suggestion: "fix it",
      },
    ]);

    expect(report).toContain("# HMR Diagnosis");
    expect(report).toContain("## circular-dependency");
    expect(report).toContain("Suggestion: fix it");
  });
});
