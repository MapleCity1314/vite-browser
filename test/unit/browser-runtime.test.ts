import { beforeEach, describe, expect, it, vi } from "vitest";

const mockState = vi.hoisted(() => {
  const page = {
    goto: vi.fn(async (url: string) => {
      mockState.currentUrl = url;
    }),
    goBack: vi.fn(async () => undefined),
    reload: vi.fn(async () => undefined),
    evaluate: vi.fn(async (arg: unknown) => {
      if (typeof arg === "string") return mockState.scriptResult;
      return mockState.evaluateResults.shift();
    }),
    url: vi.fn(() => mockState.currentUrl),
    isClosed: vi.fn(() => false),
    on: vi.fn((event: string, handler: unknown) => {
      mockState.handlers[event] = handler;
    }),
    screenshot: vi.fn(async () => undefined),
  };

  const context = {
    pages: vi.fn(() => [page]),
    newPage: vi.fn(async () => page),
    addCookies: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
    waitForEvent: vi.fn(async () => undefined),
    addInitScript: vi.fn(async () => undefined),
  };

  const browser = {
    newContext: vi.fn(async () => context),
  };

  return {
    currentUrl: "http://localhost:5173/",
    evaluateResults: [] as unknown[],
    scriptResult: { ok: true },
    handlers: {} as Record<string, unknown>,
    page,
    context,
    browser,
    launch: vi.fn(async () => browser),
    launchPersistentContext: vi.fn(async () => context),
    networkAttach: vi.fn(),
    networkClear: vi.fn(),
    networkFormat: vi.fn(() => "# Network"),
    networkDetail: vi.fn(async () => "# Network Detail"),
    vueTree: vi.fn(async () => "vue-tree"),
    vueDetails: vi.fn(async () => "vue-details"),
    vuePinia: vi.fn(async () => "pinia"),
    vueRouter: vi.fn(async () => "router"),
    reactSnapshot: vi.fn(async () => [{ id: 1 }]),
    reactFormat: vi.fn(() => "react-tree"),
    reactInspect: vi.fn(async () => ({ text: "react-details", source: ["/src/App.tsx", 7, 3] })),
    reactPath: vi.fn(() => "App > Child"),
    svelteTree: vi.fn(async () => "svelte-tree"),
    svelteDetails: vi.fn(async () => "svelte-details"),
    resolveViaSourceMap: vi.fn(async () => ({ file: "/src/main.ts", line: 10, column: 3, snippet: "10 | boom()" })),
  };
});

vi.mock("node:fs", () => ({
  existsSync: vi.fn(() => false),
  readFileSync: vi.fn(() => ""),
}));

vi.mock("playwright", () => ({
  chromium: {
    launch: mockState.launch,
    launchPersistentContext: mockState.launchPersistentContext,
  },
}));

vi.mock("../../src/network.js", () => ({
  attach: mockState.networkAttach,
  clear: mockState.networkClear,
  format: mockState.networkFormat,
  detail: mockState.networkDetail,
  setEventQueue: vi.fn(),
}));

vi.mock("../../src/vue/devtools.js", () => ({
  getComponentTree: mockState.vueTree,
  getComponentDetails: mockState.vueDetails,
  getPiniaStores: mockState.vuePinia,
  getRouterInfo: mockState.vueRouter,
}));

vi.mock("../../src/react/devtools.js", () => ({
  snapshot: mockState.reactSnapshot,
  format: mockState.reactFormat,
  inspect: mockState.reactInspect,
  path: mockState.reactPath,
}));

vi.mock("../../src/svelte/devtools.js", () => ({
  getComponentTree: mockState.svelteTree,
  getComponentDetails: mockState.svelteDetails,
}));

vi.mock("../../src/sourcemap.js", () => ({
  resolveViaSourceMap: mockState.resolveViaSourceMap,
}));

import * as browser from "../../src/browser.js";
import { EventQueue } from "../../src/event-queue.js";

describe("browser runtime flows", () => {
  beforeEach(async () => {
    mockState.currentUrl = "http://localhost:5173/";
    mockState.evaluateResults = [];
    mockState.scriptResult = { ok: true };
    mockState.handlers = {};
    mockState.page.goto.mockClear();
    mockState.page.goBack.mockClear();
    mockState.page.reload.mockClear();
    mockState.page.evaluate.mockClear();
    mockState.page.on.mockClear();
    mockState.page.screenshot.mockClear();
    mockState.context.pages.mockClear();
    mockState.context.newPage.mockClear();
    mockState.context.addCookies.mockClear();
    mockState.context.close.mockClear();
    mockState.networkAttach.mockClear();
    mockState.networkClear.mockClear();
    mockState.networkFormat.mockClear();
    mockState.networkDetail.mockClear();
    mockState.vueTree.mockClear();
    mockState.vueDetails.mockClear();
    mockState.vuePinia.mockClear();
    mockState.vueRouter.mockClear();
    mockState.reactSnapshot.mockClear();
    mockState.reactFormat.mockClear();
    mockState.reactInspect.mockClear();
    mockState.reactPath.mockClear();
    mockState.svelteTree.mockClear();
    mockState.svelteDetails.mockClear();
    mockState.resolveViaSourceMap.mockClear();
    await browser.close();
  });

  it("opens a page, injects collectors, and exposes current page", async () => {
    mockState.evaluateResults = [undefined, "vue@3.5.0"];

    await browser.open("http://localhost:5173/app");

    expect(mockState.page.goto).toHaveBeenCalledWith("http://localhost:5173/app", { waitUntil: "domcontentloaded" });
    expect(browser.getCurrentPage()).toBe(mockState.page as never);
    expect(mockState.networkAttach).toHaveBeenCalledWith(mockState.page);
    expect(mockState.context.addInitScript).toHaveBeenCalled();
  });

  it("supports goto, back, reload, cookies, and close", async () => {
    mockState.evaluateResults = [undefined, "react@19.0.0"];
    await browser.open("http://localhost:5173/app");

    mockState.evaluateResults = [undefined, "react@19.0.0"];
    const nextUrl = await browser.goto("http://localhost:5173/next");
    expect(nextUrl).toBe("http://localhost:5173/next");

    await browser.back();
    expect(mockState.page.goBack).toHaveBeenCalledWith({ waitUntil: "domcontentloaded" });

    mockState.currentUrl = "http://localhost:5173/reloaded";
    const reloaded = await browser.reload();
    expect(reloaded).toBe("http://localhost:5173/reloaded");

    const cookieCount = await browser.cookies([{ name: "token", value: "abc" }], "localhost");
    expect(cookieCount).toBe(1);
    expect(mockState.context.addCookies).toHaveBeenCalledWith([
      { name: "token", value: "abc", domain: "localhost", path: "/" },
    ]);

    await browser.close();
    expect(browser.getCurrentPage()).toBeNull();
    expect(mockState.networkClear).toHaveBeenCalled();
  });

  it("flushes queued browser events into the daemon queue", async () => {
    const queue = new EventQueue();
    mockState.evaluateResults = [undefined, [
      { timestamp: 1, type: "hmr-update", payload: { path: "/src/App.tsx" } },
      {
        timestamp: 2,
        type: "render",
        payload: {
          component: "Dashboard",
          path: "AppShell > Dashboard",
          framework: "vue",
          reason: "dom-mutation",
          storeHints: ["main"],
          changedKeys: ["filters"],
        },
      },
    ]];

    await browser.flushBrowserEvents(mockState.page as never, queue);

    expect(queue.all()).toHaveLength(2);
    expect(queue.all()[0]).toMatchObject({ type: "hmr-update" });
    expect(queue.all()[1]).toMatchObject({ type: "render" });
  });

  it("detects framework-specific runtime inspection flows", async () => {
    mockState.evaluateResults = [undefined, "react@19.0.0"];
    await browser.open("http://localhost:5173/app");

    expect(await browser.reactTree()).toBe("react-tree");
    expect(await browser.reactTree("1")).toContain("react-details");
    expect(await browser.reactTree("1")).toContain("source: /src/App.tsx:7:3");

    await browser.close();
    mockState.evaluateResults = [undefined, "vue@3.5.0"];
    await browser.open("http://localhost:5173/vue");
    expect(await browser.vueTree()).toBe("vue-tree");
    expect(await browser.vueTree("7")).toBe("vue-details");
    expect(await browser.vuePinia("main")).toBe("pinia");
    expect(await browser.vueRouter()).toBe("router");

    await browser.close();
    mockState.evaluateResults = [undefined, "svelte@5.0.0"];
    await browser.open("http://localhost:5173/svelte");
    expect(await browser.svelteTree()).toBe("svelte-tree");
    expect(await browser.svelteTree("2")).toBe("svelte-details");
  });

  it("reports runtime, hmr, module graph, errors, logs, screenshot, eval, and network", async () => {
    mockState.evaluateResults = [undefined, "vue@3.5.0"];
    await browser.open("http://localhost:5173/app");

    const consoleHandler = mockState.handlers.console as (msg: { type(): string; text(): string }) => void;
    const pageErrorHandler = mockState.handlers.pageerror as (error: Error) => void;
    consoleHandler({ type: () => "log", text: () => "[vite] connected." });
    consoleHandler({ type: () => "error", text: () => "plain issue" });
    pageErrorHandler(new Error("TypeError: runtime boom"));

    mockState.evaluateResults = [
      {
        url: "http://localhost:5173/app",
        hasViteClient: true,
        wsState: "open",
        hasErrorOverlay: false,
        timestamp: Date.now(),
      },
    ];
    expect(await browser.viteRuntimeStatus()).toContain("# Vite Runtime");

    mockState.evaluateResults = [[{ timestamp: 5, path: "/src/App.tsx" }]];
    expect(await browser.viteHMR()).toContain("# HMR Summary");
    expect(await browser.viteHMRTrace("clear")).toContain("cleared HMR trace");

    mockState.evaluateResults = [[{ url: "http://localhost:5173/src/main.ts", initiator: "script", durationMs: 1 }]];
    expect(await browser.viteModuleGraph("/src/", 10, "snapshot")).toContain("# Vite Module Graph");

    mockState.evaluateResults = [[{ url: "http://localhost:5173/src/new.ts", initiator: "script", durationMs: 1 }]];
    expect(await browser.viteModuleGraph("/src/", 10, "trace")).toContain("# Vite Module Graph Trace");
    expect(await browser.viteModuleGraph(undefined, 10, "clear")).toContain("cleared module-graph baseline");

    mockState.evaluateResults = [{ message: "TypeError: boom", stack: "at http://localhost:5173/src/main.ts:20:5" }];
    expect(await browser.errors()).toContain("TypeError: boom");

    mockState.evaluateResults = [{ message: "TypeError: boom", stack: "at http://localhost:5173/src/main.ts:20:5" }];
    expect(await browser.errors(true, true)).toContain("# Mapped Stack");

    expect(await browser.logs()).toContain("[pageerror] TypeError: runtime boom");
    expect(await browser.screenshot()).toContain("vite-browser-");

    mockState.scriptResult = { title: "Demo" };
    expect(await browser.evaluate("document.title")).toContain('"title": "Demo"');

    expect(await browser.network()).toBe("# Network");
    expect(await browser.network(1)).toBe("# Network Detail");
  });

  it("handles restart endpoint fallback", async () => {
    mockState.evaluateResults = [undefined, "vue@3.5.0"];
    await browser.open("http://localhost:5173/app");

    mockState.evaluateResults = ["restart endpoint not available"];
    expect(await browser.viteRestart()).toContain("restart endpoint not available");
  });

  it("falls back to captured runtime errors when the Vite overlay is absent", async () => {
    mockState.evaluateResults = [undefined, "vue@3.5.0"];
    await browser.open("http://localhost:5173/app");

    const pageErrorHandler = mockState.handlers.pageerror as (error: Error) => void;
    pageErrorHandler(new Error("TypeError: fallback boom\n    at http://localhost:5173/src/App.vue:9:3"));

    mockState.evaluateResults = [null];
    expect(await browser.errors()).toContain("TypeError: fallback boom");

    mockState.evaluateResults = [null];
    expect(await browser.errors(true, true)).toContain("# Mapped Stack");
  });

  it("clears stale runtime errors after a successful navigation refresh", async () => {
    mockState.evaluateResults = [undefined, "vue@3.5.0"];
    await browser.open("http://localhost:5173/app");

    const pageErrorHandler = mockState.handlers.pageerror as (error: Error) => void;
    pageErrorHandler(new Error("TypeError: stale boom"));

    mockState.evaluateResults = [null];
    expect(await browser.errors()).toContain("TypeError: stale boom");

    mockState.evaluateResults = [undefined];
    await browser.reload();

    mockState.evaluateResults = [null];
    expect(await browser.errors()).toBe("no errors");
  });
});
