import { describe, expect, it, vi } from "vitest";
import { cleanError, createRunner, dispatchLine, type BrowserApi } from "../src/daemon.js";
import { EventQueue } from "../src/event-queue.js";

function createBrowserMock() {
  return {
    getEventQueue: vi.fn(() => null),
    getCurrentPage: vi.fn(() => null),
    flushBrowserEvents: vi.fn(async () => undefined),
    open: vi.fn(async () => undefined),
    cookies: vi.fn(async () => 2),
    close: vi.fn(async () => undefined),
    goto: vi.fn(async () => "http://localhost:5173/about"),
    back: vi.fn(async () => undefined),
    reload: vi.fn(async () => "http://localhost:5173"),
    detectFramework: vi.fn(async () => "vue@3.5.0"),
    vueTree: vi.fn(async () => "tree"),
    vuePinia: vi.fn(async () => "pinia"),
    vueRouter: vi.fn(async () => "router"),
    reactTree: vi.fn(async () => "react"),
    svelteTree: vi.fn(async () => "svelte"),
    viteRestart: vi.fn(async () => "restarted"),
    viteHMRTrace: vi.fn(async () => "hmr"),
    viteRuntimeStatus: vi.fn(async () => "runtime"),
    viteModuleGraph: vi.fn(async () => "graph"),
    errors: vi.fn(async () => "errors"),
    logs: vi.fn(async () => "logs"),
    screenshot: vi.fn(async () => "/tmp/shot.png"),
    evaluate: vi.fn(async () => "{}"),
    network: vi.fn(async () => "network"),
  } as unknown as BrowserApi;
}

describe("daemon core runner", () => {
  it("normalizes vite hmr and module graph modes", async () => {
    const api = createBrowserMock();
    const run = createRunner(api);

    await run({ action: "vite-hmr", mode: "snapshot", limit: 7 });
    await run({ action: "vite-module-graph", mode: "summary", filter: "/src/" });

    expect(api.viteHMRTrace).toHaveBeenCalledWith("summary", 7);
    expect(api.viteModuleGraph).toHaveBeenCalledWith("/src/", 200, "snapshot");
  });

  it("routes errors flags and unknown actions", async () => {
    const api = createBrowserMock();
    const run = createRunner(api);

    const ok = await run({ action: "errors", mapped: true, inlineSource: true });
    const unknown = await run({ action: "nope" });

    expect(ok).toMatchObject({ ok: true, data: "errors" });
    expect(api.errors).toHaveBeenCalledWith(true, true);
    expect(unknown).toMatchObject({ ok: false, error: "unknown action: nope" });
  });

  it("correlates errors against queued hmr events", async () => {
    const api = createBrowserMock();
    const queue = new EventQueue();
    queue.push({
      timestamp: Date.now(),
      type: "hmr-update",
      payload: { path: "/src/App.tsx" },
    });
    api.getEventQueue = vi.fn(() => queue);
    api.getCurrentPage = vi.fn(() => null);
    api.errors = vi.fn(async () => "TypeError at http://localhost:5173/src/App.tsx:3:1");
    const run = createRunner(api);

    const result = await run({ action: "correlate-errors", windowMs: 5000 });

    expect(result).toMatchObject({ ok: true });
    expect(String(result.data)).toContain("Confidence: high");
    expect(String(result.data)).toContain("/src/App.tsx");
  });

  it("diagnoses hmr failures from runtime, errors, and trace data", async () => {
    const api = createBrowserMock();
    api.errors = vi.fn(
      async () => "Failed to resolve import '/src/missing.ts' from '/src/App.tsx'. Does the file exist?",
    );
    api.viteRuntimeStatus = vi.fn(async () => "# Vite Runtime\nHMR Socket: closed");
    api.viteHMRTrace = vi.fn(
      async () =>
        "# HMR Trace\n[12:00:00] error disconnected\n[12:00:01] full-reload /src/App.tsx\n[12:00:02] full-reload /src/main.tsx",
    );
    const run = createRunner(api);

    const result = await run({ action: "diagnose-hmr", limit: 50, windowMs: 5000 });

    expect(result).toMatchObject({ ok: true });
    expect(String(result.data)).toContain("missing-module");
    expect(String(result.data)).toContain("hmr-websocket-closed");
    expect(String(result.data)).toContain("repeated-full-reload");
  });

  it("flushes queued browser events before handling a command", async () => {
    const api = createBrowserMock();
    const queue = { push: vi.fn() };
    const currentPage = { isClosed: () => false };
    api.getEventQueue = vi.fn(() => queue as any);
    api.getCurrentPage = vi.fn(() => currentPage as any);
    const run = createRunner(api);

    await run({ action: "logs" });

    expect(api.flushBrowserEvents).toHaveBeenCalledWith(currentPage, queue);
    expect(api.logs).toHaveBeenCalledTimes(1);
  });

  it("skips event flush when there is no current page", async () => {
    const api = createBrowserMock();
    const queue = { push: vi.fn() };
    api.getEventQueue = vi.fn(() => queue as any);
    api.getCurrentPage = vi.fn(() => null);
    const run = createRunner(api);

    await run({ action: "logs" });

    expect(api.flushBrowserEvents).not.toHaveBeenCalled();
    expect(api.logs).toHaveBeenCalledTimes(1);
  });
});

describe("daemon line dispatch", () => {
  it("writes invalid-payload error for malformed json", async () => {
    const output: string[] = [];
    const socket = { write: (line: string) => output.push(line) };

    await dispatchLine("{bad json", socket);

    expect(output[0]).toContain('"ok":false');
    expect(output[0]).toContain("invalid command payload");
  });

  it("writes result and triggers onClose for close action", async () => {
    const output: string[] = [];
    const socket = { write: (line: string) => output.push(line) };
    const run = vi.fn(async () => ({ ok: true, data: "closed" }));
    const onClose = vi.fn();

    await dispatchLine(JSON.stringify({ id: "1", action: "close" }), socket, run, onClose);
    await new Promise((resolve) => setImmediate(resolve));

    expect(output).toHaveLength(1);
    expect(output[0]).toContain('"id":"1"');
    expect(output[0]).toContain('"ok":true');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("cleanError", () => {
  it("strips playwright prefix from page.* errors", () => {
    const err = new Error("page.goto: Error: net::ERR_ABORTED\nCall log...");
    expect(cleanError(err)).toBe("net::ERR_ABORTED");
  });

  it("handles non-error values", () => {
    expect(cleanError("oops")).toBe("oops");
  });
});
