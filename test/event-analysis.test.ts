import { describe, expect, it } from "vitest";
import {
  extractModules,
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
} from "../src/event-analysis.js";
import type { VBEvent } from "../src/event-queue.js";

describe("event-analysis", () => {
  it("sorts events chronologically and narrows event groups", () => {
    const events: VBEvent[] = [
      { timestamp: 30, type: "error", payload: { message: "boom" } },
      { timestamp: 10, type: "hmr-update", payload: { path: "/src/App.vue" } },
      { timestamp: 20, type: "render", payload: { component: "App", path: "App", framework: "vue", reason: "hmr", mutationCount: 1, storeHints: [], changedKeys: [] } },
      { timestamp: 25, type: "store-update", payload: { store: "main", mutationType: "patch", events: 1, changedKeys: ["filters"] } },
      { timestamp: 28, type: "network", payload: { url: "/api/items" } },
    ];

    const sorted = sortEventsChronologically(events);

    expect(sorted.map((event) => event.timestamp)).toEqual([10, 20, 25, 28, 30]);
    expect(getHmrEvents(sorted)).toHaveLength(1);
    expect(getRenderEvents(sorted)).toHaveLength(1);
    expect(getStoreUpdateEvents(sorted)).toHaveLength(1);
    expect(getNetworkEvents(sorted)).toHaveLength(1);
    expect(getErrorEvents(sorted)).toHaveLength(1);
  });

  it("extracts module paths from free text and hmr payloads", () => {
    expect(extractModules("boom at http://localhost:5173/src/main.ts:12:4 and /@fs/C:/work/app.tsx:1:1")).toEqual([
      "/src/main.ts",
      "/@fs/C:/work/app.tsx",
    ]);

    const modules = extractModulesFromHmrEvent({
      timestamp: 1,
      type: "hmr-update",
      payload: {
        path: "/src/App.vue",
        message: "[vite] hot updated: /src/views/Dashboard.vue",
        updates: [{ path: "/src/stores/main.ts" }],
      },
    });

    expect(modules).toEqual(["/src/App.vue", "/src/views/Dashboard.vue", "/src/stores/main.ts"]);
  });

  it("reads render/store/network/error details with fallbacks", () => {
    expect(getRenderLabel({
      component: "Dashboard",
      path: "AppShell > Dashboard",
      framework: "vue",
      reason: "dom-mutation",
      mutationCount: 1,
      storeHints: ["main", ""],
      changedKeys: [],
    })).toBe("AppShell > Dashboard");

    expect(getRenderLabel({
      component: "FallbackOnly",
      path: "",
      framework: "vue",
      reason: "dom-mutation",
      mutationCount: 1,
      storeHints: [],
      changedKeys: [],
    })).toBe("FallbackOnly");

    expect(getStoreName({ store: "main", mutationType: "patch", events: 1, changedKeys: [] })).toBe("main");
    expect(getStoreName({ store: "", mutationType: "patch", events: 1, changedKeys: [] })).toBeNull();
    expect(getChangedKeys({ store: "main", mutationType: "patch", events: 1, changedKeys: ["filters", "", "sort"] })).toEqual(["filters", "sort"]);
    expect(getStoreHints({
      component: "Dashboard",
      path: "AppShell > Dashboard",
      framework: "vue",
      reason: "dom-mutation",
      mutationCount: 1,
      storeHints: ["main", "", "cart"],
      changedKeys: [],
    })).toEqual(["main", "cart"]);
    expect(getNetworkUrl({ url: "/api/items" })).toBe("/api/items");
    expect(getNetworkUrl({ url: "" })).toBeNull();
    expect(getErrorMessage({ message: "TypeError: boom" })).toBe("TypeError: boom");
    expect(getErrorMessage({ message: "" })).toBeNull();
  });

  it("deduplicates string collections without changing first-seen order", () => {
    expect(uniqueStrings(["main", "cart", "main", "cart", "search"])).toEqual(["main", "cart", "search"]);
  });
});
