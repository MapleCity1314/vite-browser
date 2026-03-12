import { describe, expect, it } from "vitest";
import {
  correlateErrorWithHMR,
  correlateRenderWithNetwork,
  formatErrorCorrelationReport,
} from "../../src/correlate.js";
import type { VBEvent } from "../../src/event-queue.js";

describe("error correlation", () => {
  it("matches errors to recent hmr updates by module path", () => {
    const events: VBEvent[] = [
      {
        timestamp: 1000,
        type: "hmr-update",
        payload: { type: "update", updates: [{ path: "/src/App.tsx" }] },
      },
      {
        timestamp: 1500,
        type: "hmr-update",
        payload: { path: "/src/routes/home.tsx" },
      },
    ];

    const correlation = correlateErrorWithHMR(
      "TypeError: boom at http://localhost:5173/src/App.tsx:4:2",
      events,
    );

    expect(correlation).toMatchObject({
      confidence: "high",
      matchingModules: ["/src/App.tsx"],
    });
    expect(correlation?.relatedEvents).toHaveLength(1);
  });

  it("falls back to medium confidence for recent hmr error without module overlap", () => {
    const events: VBEvent[] = [
      {
        timestamp: 1000,
        type: "hmr-error",
        payload: { message: "ws closed unexpectedly" },
      },
    ];

    const correlation = correlateErrorWithHMR("ReferenceError: x is not defined", events);

    expect(correlation).toMatchObject({
      confidence: "medium",
    });
  });

  it("formats a readable report", () => {
    const events: VBEvent[] = [
      {
        timestamp: 1000,
        type: "hmr-update",
        payload: { path: "/src/App.tsx" },
      },
    ];

    const report = formatErrorCorrelationReport(
      "TypeError at /src/App.tsx:4:2",
      correlateErrorWithHMR("TypeError at /src/App.tsx:4:2", events),
    );

    expect(report).toContain("# Error Correlation");
    expect(report).toContain("Confidence: high");
    expect(report).toContain("/src/App.tsx");
  });
});

describe("render/network correlation", () => {
  it("detects repeated requests around a render event", () => {
    const events: VBEvent[] = [
      { timestamp: 1000, type: "render", payload: { component: "App" } },
      { timestamp: 1200, type: "network", payload: { url: "/api/items" } },
      { timestamp: 1300, type: "network", payload: { url: "/api/items" } },
      { timestamp: 1400, type: "network", payload: { url: "/api/items" } },
    ];

    const correlation = correlateRenderWithNetwork(events);

    expect(correlation).toMatchObject({
      requestCount: 3,
      urls: ["/api/items"],
    });
  });
});
