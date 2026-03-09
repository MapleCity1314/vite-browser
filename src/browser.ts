import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";
import * as vueDevtools from "./vue/devtools.js";
import * as reactDevtools from "./react/devtools.js";
import * as svelteDevtools from "./svelte/devtools.js";
import * as networkLog from "./network.js";
import { resolveViaSourceMap } from "./sourcemap.js";
import { EventQueue, type VBEvent } from "./event-queue.js";

const extensionPath =
  process.env.REACT_DEVTOOLS_EXTENSION ??
  resolve(import.meta.dirname, "../../next-browser/extensions/react-devtools-chrome");

const hasReactExtension = existsSync(join(extensionPath, "manifest.json"));
const installHook = hasReactExtension
  ? readFileSync(join(extensionPath, "build", "installHook.js"), "utf-8")
  : null;

let context: BrowserContext | null = null;
let page: Page | null = null;
let framework: "vue" | "react" | "svelte" | "unknown" = "unknown";
let extensionModeDisabled = false;
let eventQueue: EventQueue | null = null;

const consoleLogs: string[] = [];
const MAX_LOGS = 200;
const MAX_HMR_EVENTS = 500;
let lastReactSnapshot: reactDevtools.ReactNode[] = [];
type HmrEventType = "connecting" | "connected" | "update" | "full-reload" | "error" | "log";
export type HmrEvent = { timestamp: number; type: HmrEventType; message: string; path?: string };
export type RuntimeSnapshot = {
  url: string;
  hasViteClient: boolean;
  wsState: string;
  hasErrorOverlay: boolean;
  timestamp: number;
};
export type ModuleRow = { url: string; initiator: string; durationMs: number };
export type ModuleGraphMode = "snapshot" | "trace" | "clear";
const hmrEvents: HmrEvent[] = [];
let lastModuleGraphUrls: string[] | null = null;

export function setEventQueue(queue: EventQueue): void {
  eventQueue = queue;
}

export function getEventQueue(): EventQueue | null {
  return eventQueue;
}

export function getCurrentPage(): Page | null {
  if (!contextUsable(context)) return null;
  if (!page || page.isClosed()) return null;
  return page;
}

/**
 * Inject browser-side event collector into the page
 */
async function injectEventCollector(currentPage: Page): Promise<void> {
  await currentPage.evaluate(() => {
    if ((window as any).__vb_events) return; // already injected

    (window as any).__vb_events = [];
    (window as any).__vb_push = (event: unknown) => {
      const q = (window as any).__vb_events;
      q.push(event);
      if (q.length > 1000) q.shift();
    };

    const inferFramework = () => {
      if ((window as any).__VUE__ || (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__) return "vue";
      if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ || (window as any).React) return "react";
      if ((window as any).__SVELTE__ || (window as any).__svelte || (window as any).__SVELTE_DEVTOOLS_GLOBAL_HOOK__) {
        return "svelte";
      }
      return "unknown";
    };

    const inferRenderLabel = () => {
      const heading =
        document.querySelector("main h1, [role='main'] h1, h1")?.textContent?.trim() ||
        document.title ||
        location.pathname ||
        "/";
      return heading.slice(0, 120);
    };

    const inferVueRenderDetails = () => {
      const hook = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
      const apps = hook?.apps;
      if (!Array.isArray(apps) || apps.length === 0) return null;

      const app = apps[0];
      const rootInstance = app?._instance || app?._container?._vnode?.component;
      if (!rootInstance) return null;

      const names: string[] = [];
      let current = rootInstance;
      let guard = 0;
      while (current && guard < 8) {
        const name = current.type?.name || current.type?.__name || current.type?.__file?.split(/[\\/]/).pop()?.replace(/\.\w+$/, "") || "Anonymous";
        names.push(String(name));
        const nextFromSubtree = current.subTree?.component;
        const nextFromChildren = Array.isArray(current.subTree?.children)
          ? current.subTree.children.find((child: any) => child?.component)?.component
          : null;
        current = nextFromSubtree || nextFromChildren || null;
        guard++;
      }

      const pinia = (window as any).__PINIA__ || (window as any).pinia || app?.config?.globalProperties?.$pinia;
      const registry = pinia?._s;
      const storeIds = registry instanceof Map
        ? Array.from(registry.keys()).map(String)
        : registry && typeof registry === "object"
          ? Object.keys(registry)
          : [];

      return {
        component: names[names.length - 1] || inferRenderLabel(),
        componentPath: names.join(" > "),
        storeHints: storeIds.slice(0, 5),
      };
    };

    const inferRenderDetails = () => {
      const framework = inferFramework();
      if (framework === "vue") {
        const vue = inferVueRenderDetails();
        if (vue) {
          return {
            framework,
            component: vue.component,
            path: vue.componentPath,
            storeHints: vue.storeHints,
          };
        }
      }

      return {
        framework,
        component: inferRenderLabel(),
        path: `${framework}:${location.pathname || "/"}`,
        storeHints: [] as string[],
      };
    };

    const attachPiniaSubscriptions = () => {
      if ((window as any).__vb_pinia_attached) return;
      const hook = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
      const app = Array.isArray(hook?.apps) ? hook.apps[0] : null;
      const pinia = (window as any).__PINIA__ || (window as any).pinia || app?.config?.globalProperties?.$pinia;
      const registry = pinia?._s;
      if (!(registry instanceof Map) || registry.size === 0) return;

      const attached = ((window as any).__vb_pinia_attached = new Set<string>());

      registry.forEach((store: any, storeId: string) => {
        if (!store || typeof store.$subscribe !== "function" || attached.has(String(storeId))) return;
        attached.add(String(storeId));
        const extractChangedKeys = (mutation: any) => {
          const keys = new Set<string>();
          const events = mutation?.events;
          const collect = (entry: any) => {
            const key = entry?.key ?? entry?.path;
            if (typeof key === "string" && key.length > 0) keys.add(key.split(".")[0]);
          };
          if (Array.isArray(events)) events.forEach(collect);
          else if (events && typeof events === "object") collect(events);

          const payload = mutation?.payload;
          if (payload && typeof payload === "object" && !Array.isArray(payload)) {
            Object.keys(payload).forEach((key) => keys.add(key));
          }

          return Array.from(keys).slice(0, 10);
        };

        store.$subscribe((mutation: any) => {
          const changedKeys = extractChangedKeys(mutation);
          (window as any).__vb_push({
            timestamp: Date.now(),
            type: "store-update",
            payload: {
              store: String(storeId),
              mutationType: typeof mutation?.type === "string" ? mutation.type : "unknown",
              events: Array.isArray(mutation?.events) ? mutation.events.length : 0,
              changedKeys,
            },
          });
          scheduleRender("store-update", { changedKeys });
        }, { detached: true } as any);
      });
    };

    const renderState =
      (window as any).__vb_render_state ||
      ((window as any).__vb_render_state = {
        timer: null as number | null,
        lastReason: "initial-load",
        mutationCount: 0,
      });

    const scheduleRender = (reason: string, extra: Record<string, unknown> = {}) => {
      renderState.lastReason = reason;
      renderState.mutationCount += Number(extra.mutationCount ?? 0);
      if (renderState.timer != null) window.clearTimeout(renderState.timer);
      renderState.timer = window.setTimeout(() => {
        const details = inferRenderDetails();
        const changedKeys = Array.isArray(extra.changedKeys)
          ? extra.changedKeys.filter((value): value is string => typeof value === "string" && value.length > 0)
          : [];
        (window as any).__vb_push({
          timestamp: Date.now(),
          type: "render",
          payload: {
            component: details.component,
            path: details.path,
            framework: details.framework,
            reason: renderState.lastReason,
            mutationCount: renderState.mutationCount,
            storeHints: details.storeHints,
            changedKeys,
          },
        });
        renderState.timer = null;
        renderState.mutationCount = 0;
      }, 60);
    };

    // Subscribe to Vite HMR WebSocket
    function attachViteListener(): boolean {
      const hot = (window as any).__vite_hot;
      if (hot?.ws) {
        hot.ws.addEventListener('message', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            (window as any).__vb_push({
              timestamp: Date.now(),
              type: data.type === 'error' ? 'hmr-error' : 'hmr-update',
              payload: data
            });
            if (data.type === "update" || data.type === "full-reload") {
              scheduleRender("hmr-message");
            }
          } catch {}
        });
        return true;
      }
      return false;
    }

    // Retry if __vite_hot not ready yet
    if (!attachViteListener()) {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts++;
        if (attachViteListener() || attempts >= 50) {
          clearInterval(timer);
        }
      }, 100);
    }

    // Hook window.onerror for runtime errors
    const origOnError = window.onerror;
    window.onerror = (msg, src, line, col, err) => {
      (window as any).__vb_push({
        timestamp: Date.now(),
        type: 'error',
        payload: { message: String(msg), source: src, line, col, stack: err?.stack }
      });
      return origOnError ? origOnError(msg, src, line, col, err) : false;
    };

    // Hook unhandledrejection
    window.addEventListener('unhandledrejection', (e) => {
      (window as any).__vb_push({
        timestamp: Date.now(),
        type: 'error',
        payload: { message: e.reason?.message, stack: e.reason?.stack }
      });
    });

    const observeDom = () => {
      const root = document.body || document.documentElement;
      if (!root || (window as any).__vb_render_observer) return;
      const observer = new MutationObserver((mutations) => {
        scheduleRender("dom-mutation", { mutationCount: mutations.length });
      });
      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
      (window as any).__vb_render_observer = observer;
    };

    const patchHistory = () => {
      if ((window as any).__vb_history_patched) return;
      const wrap = (method: "pushState" | "replaceState") => {
        const original = history[method];
        const wrapped = ((...args: Parameters<History[typeof method]>) => {
          const result = Reflect.apply(original, history, args);
          scheduleRender(`history-${method}`);
          return result;
        }) as History[typeof method];
        history[method] = wrapped;
      };
      wrap("pushState");
      wrap("replaceState");
      window.addEventListener("popstate", () => scheduleRender("history-popstate"));
      window.addEventListener("hashchange", () => scheduleRender("hashchange"));
      (window as any).__vb_history_patched = true;
    };

    observeDom();
    patchHistory();
    attachPiniaSubscriptions();
    window.setInterval(attachPiniaSubscriptions, 1000);
    scheduleRender("initial-load");
  });
}

/**
 * Flush browser events into daemon event queue
 */
export async function flushBrowserEvents(currentPage: Page, queue: EventQueue): Promise<void> {
  const raw = await currentPage.evaluate(() => {
    const events = (window as any).__vb_events ?? [];
    (window as any).__vb_events = []; // clear after flush
    return events;
  });
  for (const e of raw) {
    queue.push(e as VBEvent);
  }
}

export async function open(url: string | undefined) {
  const currentPage = await ensurePage();

  if (url) {
    await currentPage.goto(url, { waitUntil: "domcontentloaded" });
    await injectEventCollector(currentPage);
    await detectFramework();
  }
}

export async function cookies(cookies: { name: string; value: string }[], domain: string) {
  if (!context) throw new Error("browser not open");
  await context.addCookies(
    cookies.map((c) => ({ name: c.name, value: c.value, domain, path: "/" })),
  );
  return cookies.length;
}

export async function close() {
  await context?.close();
  context = null;
  page = null;
  framework = "unknown";
  consoleLogs.length = 0;
  hmrEvents.length = 0;
  lastModuleGraphUrls = null;
  networkLog.clear();
  lastReactSnapshot = [];
}

async function ensurePage(): Promise<Page> {
  if (!contextUsable(context)) {
    await close();
    context = await launch();
  }

  if (!context) throw new Error("browser not open");

  if (!page || page.isClosed()) {
    try {
      page = context.pages()[0] ?? (await context.newPage());
    } catch (error) {
      if (!isClosedTargetError(error)) throw error;
      await close();
      extensionModeDisabled = true;
      context = await launch();
      page = context.pages()[0] ?? (await context.newPage());
    }
    attachListeners(page);
    networkLog.attach(page);
  }

  return page;
}

export function contextUsable(current: Pick<BrowserContext, "pages"> | null): current is Pick<BrowserContext, "pages"> {
  if (!current) return false;
  try {
    current.pages();
    return true;
  } catch {
    return false;
  }
}

export function isClosedTargetError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /Target page, context or browser has been closed/i.test(error.message);
}

async function launch(): Promise<BrowserContext> {
  if (hasReactExtension && installHook && !extensionModeDisabled) {
    try {
      const ctx = await chromium.launchPersistentContext("", {
        headless: false,
        viewport: { width: 1280, height: 720 },
        args: [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
          "--auto-open-devtools-for-tabs",
        ],
      });
      await ctx.waitForEvent("serviceworker").catch(() => {});
      await ctx.addInitScript(installHook);
      return ctx;
    } catch {
      extensionModeDisabled = true;
    }
  }

  const browser = await chromium.launch({
    headless: false,
    args: ["--auto-open-devtools-for-tabs"],
  });
  return browser.newContext({ viewport: { width: 1280, height: 720 } });
}

function attachListeners(currentPage: Page) {
  currentPage.on("console", (msg) => {
    recordConsoleMessage(consoleLogs, hmrEvents, msg.type(), msg.text());
  });
}

export function recordConsoleMessage(
  logs: string[],
  events: HmrEvent[],
  type: string,
  message: string,
  maxLogs = MAX_LOGS,
  maxEvents = MAX_HMR_EVENTS,
) {
  const text = `[${type}] ${message}`;
  logs.push(text);
  if (logs.length > maxLogs) logs.shift();

  if (!message.includes("[vite]")) return;

  const event = parseViteLog(message);
  events.push(event);
  if (events.length > maxEvents) events.shift();
}

export function parseViteLog(message: string): HmrEvent {
  const lower = message.toLowerCase();
  const event: HmrEvent = {
    timestamp: Date.now(),
    type: "log",
    message,
  };

  if (lower.includes("connecting")) event.type = "connecting";
  else if (lower.includes("connected")) event.type = "connected";
  else if (lower.includes("hot updated")) event.type = "update";
  else if (lower.includes("page reload")) event.type = "full-reload";
  else if (
    lower.includes("disconnected") ||
    lower.includes("failed to connect") ||
    lower.includes("connection lost") ||
    lower.includes("error")
  ) {
    event.type = "error";
  }

  const hotUpdateMatch = message.match(/hot updated:\s*(.+)$/i);
  if (hotUpdateMatch?.[1]) event.path = hotUpdateMatch[1].trim();
  return event;
}

export function normalizeLimit(limit: number, fallback: number, max: number): number {
  if (!Number.isFinite(limit) || limit <= 0) return fallback;
  return Math.min(limit, max);
}

export function formatRuntimeStatus(
  runtime: RuntimeSnapshot,
  currentFramework: string,
  events: HmrEvent[],
): string {
  const output: string[] = [];
  output.push("# Vite Runtime");
  output.push(`URL: ${runtime.url}`);
  output.push(`Framework: ${currentFramework}`);
  output.push(`Vite Client: ${runtime.hasViteClient ? "loaded" : "not detected"}`);
  output.push(`HMR Socket: ${runtime.wsState}`);
  output.push(`Error Overlay: ${runtime.hasErrorOverlay ? "present" : "none"}`);
  output.push(`Tracked HMR Events: ${events.length}`);

  const last = events[events.length - 1];
  if (last) {
    output.push(
      `Last HMR Event: ${new Date(last.timestamp).toLocaleTimeString()} [${last.type}] ${last.message}`,
    );
  }

  return output.join("\n");
}

export function formatHmrTrace(
  mode: "summary" | "trace",
  events: HmrEvent[],
  limit: number,
): string {
  if (events.length === 0) return "No HMR updates";

  const safeLimit = normalizeLimit(limit, 20, 200);
  const recent = events.slice(-safeLimit);

  if (mode === "summary") {
    const counts = recent.reduce<Record<string, number>>((acc, event) => {
      acc[event.type] = (acc[event.type] ?? 0) + 1;
      return acc;
    }, {});

    const lines: string[] = ["# HMR Summary"];
    lines.push(`Events considered: ${recent.length}`);
    lines.push(
      `Counts: ${Object.entries(counts)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")}`,
    );
    const last = recent[recent.length - 1];
    lines.push(
      `Last: ${new Date(last.timestamp).toLocaleTimeString()} [${last.type}] ${last.path ?? last.message}`,
    );
    lines.push("\nUse `vite-browser vite hmr trace --limit <n>` for timeline details.");
    return lines.join("\n");
  }

  return [
    "# HMR Trace",
    ...recent.map((event) => {
      const detail = event.path ? `${event.path}` : event.message;
      return `[${new Date(event.timestamp).toLocaleTimeString()}] ${event.type} ${detail}`;
    }),
  ].join("\n");
}

export function formatModuleGraphSnapshot(rows: ModuleRow[], filter?: string, limit = 200): string {
  const normalizedFilter = filter?.trim().toLowerCase();
  const safeLimit = normalizeLimit(limit, 200, 500);
  const filtered = rows.filter((row) =>
    normalizedFilter ? row.url.toLowerCase().includes(normalizedFilter) : true,
  );
  const limited = filtered.slice(0, safeLimit);

  if (limited.length === 0) return "No module resources found";

  const lines: string[] = [];
  lines.push("# Vite Module Graph (loaded resources)");
  lines.push(`Total: ${filtered.length}${filtered.length > limited.length ? ` (showing ${limited.length})` : ""}`);
  lines.push("# idx initiator ms url");
  lines.push("");
  limited.forEach((row, idx) => {
    lines.push(`${idx} ${row.initiator} ${row.durationMs}ms ${row.url}`);
  });

  return lines.join("\n");
}

export function formatModuleGraphTrace(
  currentUrls: string[],
  previousUrls: Set<string> | null,
  filter?: string,
  limit = 200,
): string {
  if (!previousUrls) {
    return "No module-graph baseline. Captured current snapshot; run `vite module-graph trace` again.";
  }

  const currentSet = new Set(currentUrls);
  const added = currentUrls.filter((url) => !previousUrls.has(url));
  const removed = [...previousUrls].filter((url) => !currentSet.has(url));
  const normalizedFilter = filter?.trim().toLowerCase();
  const safeLimit = normalizeLimit(limit, 200, 500);

  const addedFiltered = normalizedFilter
    ? added.filter((url) => url.toLowerCase().includes(normalizedFilter))
    : added;
  const removedFiltered = normalizedFilter
    ? removed.filter((url) => url.toLowerCase().includes(normalizedFilter))
    : removed;

  const lines: string[] = [];
  lines.push("# Vite Module Graph Trace");
  lines.push(`Added: ${addedFiltered.length}, Removed: ${removedFiltered.length}`);
  lines.push("");
  lines.push("## Added");
  if (addedFiltered.length === 0) lines.push("(none)");
  else addedFiltered.slice(0, safeLimit).forEach((url) => lines.push(`+ ${url}`));
  lines.push("");
  lines.push("## Removed");
  if (removedFiltered.length === 0) lines.push("(none)");
  else removedFiltered.slice(0, safeLimit).forEach((url) => lines.push(`- ${url}`));
  return lines.join("\n");
}

export async function goto(url: string) {
  const currentPage = await ensurePage();
  await currentPage.goto(url, { waitUntil: "domcontentloaded" });
  await injectEventCollector(currentPage);
  await detectFramework();
  return currentPage.url();
}

export async function back() {
  const currentPage = await ensurePage();
  await currentPage.goBack({ waitUntil: "domcontentloaded" });
}

export async function reload() {
  const currentPage = await ensurePage();
  await currentPage.reload({ waitUntil: "domcontentloaded" });
  return currentPage.url();
}

export async function detectFramework(): Promise<string> {
  if (!page) throw new Error("browser not open");

  const detected = await page.evaluate(() => {
    if ((window as any).__VUE__ || (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__) {
      const version = (window as any).__VUE__?.version || "unknown";
      return `vue@${version}`;
    }

    const reactHook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (reactHook || (window as any).React || document.querySelector("[data-reactroot]")) {
      const renderers = reactHook?.renderers;
      const firstRenderer = renderers ? renderers.values().next().value : null;
      const version = firstRenderer?.version || (window as any).React?.version || "unknown";
      return `react@${version}`;
    }

    if (
      (window as any).__SVELTE__ ||
      (window as any).__svelte ||
      (window as any).__SVELTE_DEVTOOLS_GLOBAL_HOOK__
    ) {
      const version =
        (window as any).__SVELTE__?.VERSION ||
        (window as any).__svelte?.version ||
        "unknown";
      return `svelte@${version}`;
    }

    return "unknown";
  });

  if (detected.startsWith("vue")) framework = "vue";
  else if (detected.startsWith("react")) framework = "react";
  else if (detected.startsWith("svelte")) framework = "svelte";
  else framework = "unknown";

  return detected;
}

export async function vueTree(id?: string): Promise<string> {
  if (!page) throw new Error("browser not open");
  return id ? vueDevtools.getComponentDetails(page, id) : vueDevtools.getComponentTree(page);
}

export async function vuePinia(store?: string): Promise<string> {
  if (!page) throw new Error("browser not open");
  return vueDevtools.getPiniaStores(page, store);
}

export async function vueRouter(): Promise<string> {
  if (!page) throw new Error("browser not open");
  return vueDevtools.getRouterInfo(page);
}

export async function reactTree(id?: string): Promise<string> {
  if (!page) throw new Error("browser not open");

  if (!id) {
    lastReactSnapshot = await reactDevtools.snapshot(page);
    return reactDevtools.format(lastReactSnapshot);
  }

  const parsed = Number.parseInt(id, 10);
  if (!Number.isFinite(parsed)) throw new Error("react component id must be a number");

  const inspected = await reactDevtools.inspect(page, parsed);
  const lines: string[] = [];

  const componentPath = reactDevtools.path(lastReactSnapshot, parsed);
  if (componentPath) lines.push(`path: ${componentPath}`);

  lines.push(inspected.text);
  if (inspected.source) {
    const [file, line, column] = inspected.source;
    lines.push(`source: ${file}:${line}:${column}`);
  }

  return lines.join("\n");
}

export async function svelteTree(id?: string): Promise<string> {
  if (!page) throw new Error("browser not open");
  return id ? svelteDevtools.getComponentDetails(page, id) : svelteDevtools.getComponentTree(page);
}

export async function viteRestart(): Promise<string> {
  if (!page) throw new Error("browser not open");

  return page.evaluate(async () => {
    try {
      const response = await fetch("/__vite_restart", { method: "POST" });
      return response.ok ? "restarted" : "restart endpoint not available";
    } catch {
      return "restart endpoint not available (install vite-browser plugin)";
    }
  });
}

export async function viteHMR(): Promise<string> {
  if (!page) throw new Error("browser not open");

  return viteHMRTrace("summary", 20);
}

export async function viteRuntimeStatus(): Promise<string> {
  if (!page) throw new Error("browser not open");

  const runtime = await page.evaluate((): RuntimeSnapshot => {
    const findViteClient = () => {
      const scripts = Array.from(document.querySelectorAll("script[src]"));
      return scripts.some((script) => script.getAttribute("src")?.includes("/@vite/client"));
    };

    const wsStateName = (wsState: number | undefined) => {
      if (wsState == null) return "unknown";
      if (wsState === 0) return "connecting";
      if (wsState === 1) return "open";
      if (wsState === 2) return "closing";
      if (wsState === 3) return "closed";
      return "unknown";
    };

    const hot = (window as any).__vite_hot;
    const ws = hot?.ws || hot?.socket;

    return {
      url: location.href,
      hasViteClient: findViteClient(),
      wsState: wsStateName(ws?.readyState),
      hasErrorOverlay: Boolean(document.querySelector("vite-error-overlay")),
      timestamp: Date.now(),
    };
  });

  return formatRuntimeStatus(runtime, framework, hmrEvents);
}

export async function viteHMRTrace(mode: "summary" | "trace" | "clear", limit = 20): Promise<string> {
  if (!page) throw new Error("browser not open");

  if (mode === "clear") {
    hmrEvents.length = 0;
    return "cleared HMR trace";
  }

  if (hmrEvents.length === 0) {
    const fallback = await page.evaluate(() => {
      const updates = (window as any).__vite_hmr_updates || [];
      return updates.slice(-20).map((u: any) => ({
        timestamp: u.timestamp ?? Date.now(),
        type: "update" as const,
        message: u.path ? `[vite] hot updated: ${u.path}` : "[vite] hot updated",
        path: u.path,
      }));
    });
    if (fallback.length > 0) hmrEvents.push(...fallback);
  }

  if (hmrEvents.length === 0) return "No HMR updates";
  return formatHmrTrace(mode, hmrEvents, limit);
}

export async function viteModuleGraph(
  filter?: string,
  limit = 200,
  mode: ModuleGraphMode = "snapshot",
): Promise<string> {
  if (!page) throw new Error("browser not open");

  if (mode === "clear") {
    lastModuleGraphUrls = null;
    return "cleared module-graph baseline";
  }

  const moduleRows = await collectModuleRows(page);
  const currentUrls = moduleRows.map((row) => row.url);
  const previousUrls = lastModuleGraphUrls ? new Set(lastModuleGraphUrls) : null;
  lastModuleGraphUrls = [...currentUrls];

  if (mode === "trace") {
    return formatModuleGraphTrace(currentUrls, previousUrls, filter, limit);
  }

  return formatModuleGraphSnapshot(moduleRows, filter, limit);
}

async function collectModuleRows(page: Page): Promise<ModuleRow[]> {
  return page.evaluate(() => {
    const isLikelyModuleUrl = (url: string) => {
      if (!url) return false;
      if (url.includes("/@vite/")) return true;
      if (url.includes("/@id/")) return true;
      if (url.includes("/src/")) return true;
      if (url.includes("/node_modules/")) return true;
      return /\.(mjs|cjs|js|jsx|ts|tsx|vue|css)(\?|$)/.test(url);
    };

    const scripts = Array.from(document.querySelectorAll("script[src]")).map(
      (node) => (node as HTMLScriptElement).src,
    );
    const resources = performance
      .getEntriesByType("resource")
      .map((entry) => {
        const item = entry as PerformanceResourceTiming;
        return {
          url: item.name,
          initiator: item.initiatorType || "unknown",
          durationMs: Number(item.duration.toFixed(1)),
        };
      })
      .filter((entry) => isLikelyModuleUrl(entry.url));

    const all = [
      ...scripts
        .filter((url) => isLikelyModuleUrl(url))
        .map((url) => ({ url, initiator: "script-tag", durationMs: 0 })),
      ...resources,
    ];

    const seen = new Set<string>();
    const unique: ModuleRow[] = [];
    for (const row of all) {
      if (seen.has(row.url)) continue;
      seen.add(row.url);
      unique.push(row);
    }
    return unique;
  });
}

export async function errors(mapped = false, inlineSource = false): Promise<string> {
  if (!page) throw new Error("browser not open");

  const errorInfo = await page.evaluate(() => {
    const overlay = document.querySelector("vite-error-overlay");
    if (!overlay || !overlay.shadowRoot) return null;

    const message = overlay.shadowRoot.querySelector(".message")?.textContent?.trim();
    const stack = overlay.shadowRoot.querySelector(".stack")?.textContent?.trim();

    return { message, stack };
  });

  if (!errorInfo) return "no errors";

  const raw = `${errorInfo.message ?? "Vite error"}\n\n${errorInfo.stack ?? ""}`.trim();
  if (!mapped) return raw;

  const origin = new URL(page.url()).origin;
  const mappedStack = await mapStackTrace(raw, origin, inlineSource);
  return mappedStack;
}

export async function logs(): Promise<string> {
  if (consoleLogs.length === 0) return "no logs";
  return consoleLogs.slice(-50).join("\n");
}

export async function screenshot(): Promise<string> {
  if (!page) throw new Error("browser not open");
  const path = join(tmpdir(), `vite-browser-${Date.now()}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

export async function evaluate(script: string): Promise<string> {
  if (!page) throw new Error("browser not open");
  const result = await page.evaluate(script);
  return JSON.stringify(result, null, 2);
}

export async function network(idx?: number): Promise<string> {
  if (idx == null) return networkLog.format();
  return networkLog.detail(idx);
}

export async function mapStackTrace(
  stack: string,
  origin: string,
  inlineSource = false,
  resolver: typeof resolveViaSourceMap = resolveViaSourceMap,
): Promise<string> {
  const locationRegex = /(https?:\/\/[^\s)]+):(\d+):(\d+)/g;
  const matches = Array.from(stack.matchAll(locationRegex));
  if (matches.length === 0) return stack;

  const mappedLines: string[] = [];
  for (const match of matches) {
    const fileUrl = match[1];
    const line = Number.parseInt(match[2], 10);
    const column = Number.parseInt(match[3], 10);
    if (!Number.isFinite(line) || !Number.isFinite(column)) continue;

    const mapped = await resolver(origin, fileUrl, line, column, inlineSource);
    if (!mapped) continue;
    mappedLines.push(`- ${fileUrl}:${line}:${column} -> ${mapped.file}:${mapped.line}:${mapped.column}`);
    if (inlineSource && mapped.snippet) {
      mappedLines.push(`  ${mapped.snippet}`);
    }
  }

  if (mappedLines.length === 0) return stack;
  return `${stack}\n\n# Mapped Stack\n${mappedLines.join("\n")}`;
}
