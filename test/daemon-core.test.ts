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
    getTrackedHmrEvents: vi.fn(() => []),
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
  it("routes browser, framework, and utility commands", async () => {
    const api = createBrowserMock();
    const run = createRunner(api);

    await expect(run({ action: "open", url: "http://localhost:5173" })).resolves.toMatchObject({ ok: true });
    await expect(run({ action: "cookies", cookies: [{ name: "a", value: "b" }], domain: "localhost" })).resolves.toMatchObject({ ok: true, data: 2 });
    await expect(run({ action: "close" })).resolves.toMatchObject({ ok: true });
    await expect(run({ action: "goto", url: "http://localhost:5173/about" })).resolves.toMatchObject({ ok: true, data: "http://localhost:5173/about" });
    await expect(run({ action: "back" })).resolves.toMatchObject({ ok: true });
    await expect(run({ action: "reload" })).resolves.toMatchObject({ ok: true, data: "http://localhost:5173" });
    await expect(run({ action: "detect" })).resolves.toMatchObject({ ok: true, data: "vue@3.5.0" });
    await expect(run({ action: "vue-tree", id: "1" })).resolves.toMatchObject({ ok: true, data: "tree" });
    await expect(run({ action: "vue-pinia", store: "main" })).resolves.toMatchObject({ ok: true, data: "pinia" });
    await expect(run({ action: "vue-router" })).resolves.toMatchObject({ ok: true, data: "router" });
    await expect(run({ action: "react-tree", id: "2" })).resolves.toMatchObject({ ok: true, data: "react" });
    await expect(run({ action: "svelte-tree", id: "3" })).resolves.toMatchObject({ ok: true, data: "svelte" });
    await expect(run({ action: "vite-restart" })).resolves.toMatchObject({ ok: true, data: "restarted" });
    await expect(run({ action: "vite-runtime" })).resolves.toMatchObject({ ok: true, data: "runtime" });
    await expect(run({ action: "logs" })).resolves.toMatchObject({ ok: true, data: "logs" });
    await expect(run({ action: "screenshot" })).resolves.toMatchObject({ ok: true, data: "/tmp/shot.png" });
    await expect(run({ action: "eval", script: "1+1" })).resolves.toMatchObject({ ok: true, data: "{}" });
    await expect(run({ action: "network", idx: 1 })).resolves.toMatchObject({ ok: true, data: "network" });
  });

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

  it("uses tracked HMR fallback when the event queue has no HMR updates", async () => {
    const api = createBrowserMock();
    api.errors = vi.fn(async () => "TypeError at http://localhost:5173/src/components/CartSummary.vue:3:1");
    api.viteHMRTrace = vi.fn(async () => "# HMR Trace\n- /src/stores/cart.ts");
    api.getTrackedHmrEvents = vi.fn(() => [
      {
        timestamp: Date.now(),
        type: "hmr-update",
        payload: { path: "/src/stores/cart.ts", updates: [{ path: "/src/stores/cart.ts" }] },
      },
    ]);
    const run = createRunner(api);

    const result = await run({ action: "correlate-errors", windowMs: 5000 });

    expect(result).toMatchObject({ ok: true });
    expect(String(result.data)).toContain("Confidence: high");
    expect(String(result.data)).toContain("/src/stores/cart.ts");
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

  it("correlates renders and diagnoses propagation from queued events", async () => {
    const api = createBrowserMock();
    const queue = new EventQueue();
    queue.push({
      timestamp: Date.now() - 20,
      type: "hmr-update",
      payload: { path: "/src/App.vue" },
    });
    queue.push({
      timestamp: Date.now() - 15,
      type: "store-update",
      payload: { store: "main", mutationType: "patch object", changedKeys: ["filters"] },
    });
    queue.push({
      timestamp: Date.now() - 10,
      type: "render",
      payload: { component: "Dashboard", path: "App > Dashboard", storeHints: ["main"] },
    });
    queue.push({
      timestamp: Date.now(),
      type: "error",
      payload: { message: "TypeError: boom" },
    });
    api.getEventQueue = vi.fn(() => queue);
    const run = createRunner(api);

    const correlation = await run({ action: "correlate-renders", windowMs: 5000 });
    const diagnosis = await run({ action: "diagnose-propagation", windowMs: 5000 });

    expect(String(correlation.data)).toContain("# Render Correlation");
    expect(String(correlation.data)).toContain("/src/App.vue");
    expect(String(correlation.data)).toContain("## Store Updates");
    expect(String(correlation.data)).toContain("## Changed Keys");
    expect(String(correlation.data)).toContain("## Store Hints");
    expect(String(diagnosis.data)).toContain("# Propagation Diagnosis");
    expect(String(diagnosis.data)).toContain("store -> render -> error");
    expect(String(diagnosis.data)).toContain("store main");
    expect(String(diagnosis.data)).toContain("Changed keys: filters.");
  });

  it("retries propagation reads when render events land shortly after the triggering command", async () => {
    const api = createBrowserMock();
    const queue = new EventQueue();
    const currentPage = { isClosed: () => false, waitForTimeout: vi.fn(async () => undefined) };
    let flushes = 0;

    api.getEventQueue = vi.fn(() => queue);
    api.getCurrentPage = vi.fn(() => currentPage as any);
    api.flushBrowserEvents = vi.fn(async () => {
      flushes++;
      if (flushes !== 2) return;
      queue.push({
        timestamp: Date.now() - 20,
        type: "store-update",
        payload: { store: "cart", mutationType: "direct", events: 0, changedKeys: ["items"] },
      } as any);
      queue.push({
        timestamp: Date.now() - 10,
        type: "render",
        payload: {
          component: "ShoppingCart",
          path: "App > RouterView > ShoppingCart",
          framework: "vue",
          reason: "store-update",
          mutationCount: 0,
          storeHints: ["cart"],
          changedKeys: ["items"],
        },
      } as any);
      queue.push({
        timestamp: Date.now(),
        type: "error",
        payload: { message: "TypeError: boom" },
      } as any);
    });
    const run = createRunner(api);

    const correlation = await run({ action: "correlate-renders", windowMs: 5000 });
    const diagnosis = await run({ action: "diagnose-propagation", windowMs: 5000 });

    expect(currentPage.waitForTimeout).toHaveBeenCalled();
    expect(flushes).toBeGreaterThanOrEqual(3);
    expect(String(correlation.data)).toContain("## Store Updates");
    expect(String(correlation.data)).toContain("ShoppingCart");
    expect(String(diagnosis.data)).toContain("store -> render -> error");
  });

  it("flushes delayed propagation events after eval commands", async () => {
    const api = createBrowserMock();
    const queue = new EventQueue();
    const currentPage = { isClosed: () => false, waitForTimeout: vi.fn(async () => undefined) };
    let flushes = 0;

    api.getEventQueue = vi.fn(() => queue);
    api.getCurrentPage = vi.fn(() => currentPage as any);
    api.evaluate = vi.fn(async () => '{"ok":true}');
    api.flushBrowserEvents = vi.fn(async () => {
      flushes++;
      if (flushes !== 2) return;
      queue.push({
        timestamp: Date.now() - 15,
        type: "store-update",
        payload: { store: "cart", mutationType: "direct", events: 0, changedKeys: ["items"] },
      } as any);
      queue.push({
        timestamp: Date.now() - 10,
        type: "render",
        payload: {
          component: "ShoppingCart",
          path: "App > RouterView > ShoppingCart",
          framework: "vue",
          reason: "store-update",
          mutationCount: 0,
          storeHints: ["cart"],
          changedKeys: ["items"],
        },
      } as any);
    });
    const run = createRunner(api);

    const evalResult = await run({ action: "eval", script: "window.location.href" });
    const correlation = await run({ action: "correlate-renders", windowMs: 5000 });

    expect(evalResult).toMatchObject({ ok: true, data: '{"ok":true}' });
    expect(currentPage.waitForTimeout).toHaveBeenCalled();
    expect(flushes).toBeGreaterThanOrEqual(3);
    expect(String(correlation.data)).toContain("## Store Updates");
    expect(String(correlation.data)).toContain("ShoppingCart");
  });

  it("uses the current runtime error as propagation evidence when the queue lacks error events", async () => {
    const api = createBrowserMock();
    const queue = new EventQueue();
    queue.push({
      timestamp: Date.now() - 10,
      type: "render",
      payload: {
        component: "ShoppingCart",
        path: "App > RouterView > ShoppingCart",
        framework: "vue",
        reason: "initial-load",
        mutationCount: 0,
        storeHints: ["cart"],
        changedKeys: [],
      },
    } as any);
    api.getEventQueue = vi.fn(() => queue);
    api.errors = vi.fn(async () => "TypeError: boom");
    const run = createRunner(api);

    const correlation = await run({ action: "correlate-renders", windowMs: 5000 });
    const diagnosis = await run({ action: "diagnose-propagation", windowMs: 5000 });

    expect(String(correlation.data)).toContain("## Store Updates");
    expect(String(correlation.data)).toContain("## Errors");
    expect(String(correlation.data)).toContain("TypeError: boom");
    expect(String(diagnosis.data)).toContain("store -> render -> error");
  });

  it("infers changed keys from the live store when event payloads omit them", async () => {
    const api = createBrowserMock();
    const queue = new EventQueue();
    queue.push({
      timestamp: Date.now() - 20,
      type: "store-update",
      payload: { store: "cart", mutationType: "direct", events: 0, changedKeys: [] },
    } as any);
    queue.push({
      timestamp: Date.now() - 10,
      type: "render",
      payload: {
        component: "CartSummary",
        path: "App > ShoppingCart > CartSummary",
        framework: "vue",
        reason: "store-update",
        mutationCount: 0,
        storeHints: ["cart"],
        changedKeys: [],
      },
    } as any);
    queue.push({
      timestamp: Date.now(),
      type: "error",
      payload: { message: "TypeError: boom" },
    } as any);
    api.getEventQueue = vi.fn(() => queue);
    api.evaluate = vi.fn(async () => '["items"]');
    const run = createRunner(api);

    const correlation = await run({ action: "correlate-renders", windowMs: 5000 });
    const diagnosis = await run({ action: "diagnose-propagation", windowMs: 5000 });

    expect(String(correlation.data)).toContain("## Changed Keys");
    expect(String(correlation.data)).toContain("items");
    expect(String(diagnosis.data)).toContain("Changed keys: items.");
  });

  it("returns a no-correlation report when there are no current errors", async () => {
    const api = createBrowserMock();
    api.errors = vi.fn(async () => "no errors");
    const run = createRunner(api);

    const result = await run({ action: "correlate-errors", windowMs: 5000 });

    expect(result).toMatchObject({ ok: true });
    expect(String(result.data)).toContain("# Error Correlation");
    expect(String(result.data)).toContain("No recent HMR events correlated");
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

  it("writes cleaned error when runner rejects", async () => {
    const output: string[] = [];
    const socket = { write: (line: string) => output.push(line) };
    const run = vi.fn(async () => {
      throw new Error("page.goto: Error: net::ERR_ABORTED\nCall log...");
    });

    await dispatchLine(JSON.stringify({ id: "2", action: "goto" }), socket, run);

    expect(output[0]).toContain('"ok":false');
    expect(output[0]).toContain("net::ERR_ABORTED");
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
