import { describe, expect, it, vi } from "vitest";
import {
  contextUsable,
  formatHmrTrace,
  formatModuleGraphSnapshot,
  formatModuleGraphTrace,
  formatRuntimeStatus,
  isClosedTargetError,
  mapStackTrace,
  normalizeLimit,
  parseViteLog,
  recordConsoleMessage,
  type HmrEvent,
} from "../src/browser.js";

describe("browser core helpers", () => {
  it("classifies vite log messages", () => {
    expect(parseViteLog("[vite] connecting...").type).toBe("connecting");
    expect(parseViteLog("[vite] connected.").type).toBe("connected");
    expect(parseViteLog("[vite] hot updated: /src/App.vue")).toMatchObject({
      type: "update",
      path: "/src/App.vue",
    });
    expect(parseViteLog("[vite] page reload src/main.ts").type).toBe("full-reload");
    expect(parseViteLog("[vite] failed to connect").type).toBe("error");
  });

  it("maps stack trace lines via injected resolver", async () => {
    const resolver = vi.fn(async (_origin: string, fileUrl: string) => {
      if (!fileUrl.includes("main.ts")) return null;
      return {
        file: "/src/main.ts",
        line: 9,
        column: 13,
        snippet: "9 | throw new Error('x')",
      };
    });

    const stack =
      "boom\nat http://localhost:5173/src/main.ts:12:4\nat http://localhost:5173/src/other.ts:1:1";
    const mapped = await mapStackTrace(stack, "http://localhost:5173", true, resolver as never);

    expect(mapped).toContain("# Mapped Stack");
    expect(mapped).toContain(
      "- http://localhost:5173/src/main.ts:12:4 -> /src/main.ts:9:13",
    );
    expect(mapped).toContain("9 | throw new Error('x')");
    expect(resolver).toHaveBeenCalledTimes(2);
  });

  it("returns original stack when no location matches", async () => {
    const resolver = vi.fn();
    const raw = "no urls here";
    const out = await mapStackTrace(raw, "http://localhost:5173", false, resolver as never);
    expect(out).toBe(raw);
    expect(resolver).not.toHaveBeenCalled();
  });

  it("formats runtime status with last event", () => {
    const events: HmrEvent[] = [
      { timestamp: 0, type: "connecting", message: "[vite] connecting..." },
      { timestamp: 1, type: "update", message: "[vite] hot updated: /src/App.vue" },
    ];
    const out = formatRuntimeStatus(
      {
        url: "http://localhost:5173",
        hasViteClient: true,
        wsState: "open",
        hasErrorOverlay: false,
        timestamp: Date.now(),
      },
      "vue",
      events,
    );

    expect(out).toContain("# Vite Runtime");
    expect(out).toContain("Framework: vue");
    expect(out).toContain("Tracked HMR Events: 2");
    expect(out).toContain("Last HMR Event:");
  });

  it("formats hmr summary and trace output", () => {
    const events: HmrEvent[] = [
      { timestamp: Date.now(), type: "connecting", message: "[vite] connecting..." },
      { timestamp: Date.now(), type: "update", message: "[vite] hot updated", path: "/src/a.ts" },
      { timestamp: Date.now(), type: "error", message: "[vite] disconnected" },
    ];
    const summary = formatHmrTrace("summary", events, 2);
    const trace = formatHmrTrace("trace", events, 2);

    expect(summary).toContain("# HMR Summary");
    expect(summary).toContain("Events considered: 2");
    expect(summary).toContain("Counts:");
    expect(trace).toContain("# HMR Trace");
    expect(trace).toContain("/src/a.ts");
  });

  it("formats module graph snapshot and trace diff", () => {
    const snapshot = formatModuleGraphSnapshot(
      [
        { url: "http://localhost:5173/src/main.ts", initiator: "script", durationMs: 1.1 },
        { url: "http://localhost:5173/src/App.vue", initiator: "fetch", durationMs: 3.2 },
      ],
      "/src/",
      10,
    );
    const trace = formatModuleGraphTrace(
      ["http://localhost:5173/src/main.ts", "http://localhost:5173/src/new.ts"],
      new Set(["http://localhost:5173/src/main.ts", "http://localhost:5173/src/old.ts"]),
      "/src/",
      10,
    );

    expect(snapshot).toContain("# Vite Module Graph (loaded resources)");
    expect(snapshot).toContain("Total: 2");
    expect(trace).toContain("# Vite Module Graph Trace");
    expect(trace).toContain("+ http://localhost:5173/src/new.ts");
    expect(trace).toContain("- http://localhost:5173/src/old.ts");
  });

  it("normalizes invalid limits and empty outputs", () => {
    expect(normalizeLimit(-1, 20, 200)).toBe(20);
    expect(normalizeLimit(999, 20, 200)).toBe(200);
    expect(formatHmrTrace("trace", [], 20)).toBe("No HMR updates");
    expect(formatModuleGraphSnapshot([], "/src/", 20)).toBe("No module resources found");
    expect(formatModuleGraphTrace(["/src/a.ts"], null, undefined, 20)).toContain("No module-graph baseline");
  });

  it("records console messages and vite hmr events with caps", () => {
    const logs: string[] = [];
    const events: HmrEvent[] = [];

    recordConsoleMessage(logs, events, "debug", "[vite] hot updated: /src/App.vue", 1, 1);
    recordConsoleMessage(logs, events, "log", "plain message", 1, 1);

    expect(logs).toEqual(["[log] plain message"]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: "update", path: "/src/App.vue" });
  });

  it("detects usable contexts and closed-target errors", () => {
    expect(contextUsable(null)).toBe(false);
    expect(contextUsable({ pages: () => [] } as never)).toBe(true);
    expect(
      contextUsable({
        pages: () => {
          throw new Error("closed");
        },
      } as never),
    ).toBe(false);

    expect(isClosedTargetError(new Error("Target page, context or browser has been closed"))).toBe(true);
    expect(isClosedTargetError(new Error("other"))).toBe(false);
    expect(isClosedTargetError("nope")).toBe(false);
  });
});
