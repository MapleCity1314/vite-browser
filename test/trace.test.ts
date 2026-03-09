import { describe, expect, it } from "vitest";
import { correlateRenderPropagation, formatPropagationTraceReport } from "../src/trace.js";
import type { VBEvent } from "../src/event-queue.js";

describe("trace", () => {
  it("builds a propagation trace from render-adjacent events", () => {
    const events: VBEvent[] = [
      { timestamp: 1000, type: "hmr-update", payload: { path: "/src/App.vue" } },
      {
        timestamp: 1050,
        type: "store-update",
        payload: { store: "main", mutationType: "patch object", changedKeys: ["filters", "sort"] },
      },
      {
        timestamp: 1100,
        type: "render",
        payload: {
          component: "Dashboard",
          path: "AppShell > Dashboard",
          storeHints: ["main"],
        },
      },
      { timestamp: 1200, type: "network", payload: { url: "/api/items" } },
      { timestamp: 1300, type: "error", payload: { message: "TypeError: boom" } },
    ];

    const trace = correlateRenderPropagation(events);

    expect(trace).toMatchObject({
      confidence: "high",
      sourceModules: ["/src/App.vue"],
      storeUpdates: ["main"],
      changedKeys: ["filters", "sort"],
      renderComponents: ["AppShell > Dashboard"],
      storeHints: ["main"],
      networkUrls: ["/api/items"],
      errorMessages: ["TypeError: boom"],
    });
  });

  it("formats an empty render correlation state", () => {
    expect(formatPropagationTraceReport(null)).toContain("No render/update events available");
  });
});
