import { createServer } from "node:net";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import type { Socket } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import * as browser from "./browser.js";
import { correlateErrorWithHMR, formatErrorCorrelationReport } from "./correlate.js";
import { diagnoseHMR, formatDiagnosisReport } from "./diagnose.js";
import { diagnosePropagation, formatPropagationDiagnosisReport } from "./diagnose-propagation.js";
import { extractModules } from "./event-analysis.js";
import { socketDir, socketPath, pidFile } from "./paths.js";
import { correlateRenderPropagation, formatPropagationTraceReport } from "./trace.js";
import type { PropagationTrace } from "./trace.js";
import { EventQueue } from "./event-queue.js";
import * as networkLog from "./network.js";

export type BrowserApi = typeof browser;
export type Cmd = {
  action: string;
  url?: string;
  id?: string;
  script?: string;
  idx?: number;
  mode?: "summary" | "trace" | "clear" | "snapshot";
  limit?: number;
  windowMs?: number;
  filter?: string;
  mapped?: boolean;
  inlineSource?: boolean;
  cookies?: { name: string; value: string }[];
  domain?: string;
  store?: string;
};

export function cleanError(err: unknown) {
  if (!(err instanceof Error)) return String(err);
  const msg = err.message;
  const m = msg.match(/^page\.\w+: (?:Error: )?(.+?)(?:\n|$)/);
  return m ? m[1] : msg;
}

export function createRunner(api: BrowserApi = browser) {
  return async function run(cmd: Cmd) {
    const queue = api.getEventQueue();
    await flushCurrentPageEvents(api, queue);

    // Browser control
    if (cmd.action === "open") {
      await api.open(cmd.url);
      return { ok: true };
    }
    if (cmd.action === "cookies") {
      const data = await api.cookies(cmd.cookies!, cmd.domain!);
      return { ok: true, data };
    }
    if (cmd.action === "close") {
      await api.close();
      return { ok: true };
    }
    if (cmd.action === "goto") {
      const data = await api.goto(cmd.url!);
      return { ok: true, data };
    }
    if (cmd.action === "back") {
      await api.back();
      return { ok: true };
    }
    if (cmd.action === "reload") {
      const data = await api.reload();
      return { ok: true, data };
    }

    // Framework detection
    if (cmd.action === "detect") {
      const data = await api.detectFramework();
      return { ok: true, data };
    }

    // Vue commands
    if (cmd.action === "vue-tree") {
      const data = await api.vueTree(cmd.id);
      return { ok: true, data };
    }
    if (cmd.action === "vue-pinia") {
      const data = await api.vuePinia(cmd.store);
      return { ok: true, data };
    }
    if (cmd.action === "vue-router") {
      const data = await api.vueRouter();
      return { ok: true, data };
    }

    // React commands
    if (cmd.action === "react-tree") {
      const data = await api.reactTree(cmd.id);
      return { ok: true, data };
    }

    // Svelte commands
    if (cmd.action === "svelte-tree") {
      const data = await api.svelteTree(cmd.id);
      return { ok: true, data };
    }

    // Vite commands
    if (cmd.action === "vite-restart") {
      const data = await api.viteRestart();
      return { ok: true, data };
    }
    if (cmd.action === "vite-hmr") {
      const hmrMode = cmd.mode === "trace" || cmd.mode === "clear" ? cmd.mode : "summary";
      const data = await api.viteHMRTrace(hmrMode, cmd.limit ?? 20);
      return { ok: true, data };
    }
    if (cmd.action === "vite-runtime") {
      const data = await api.viteRuntimeStatus();
      return { ok: true, data };
    }
    if (cmd.action === "vite-module-graph") {
      const graphMode = cmd.mode === "trace" || cmd.mode === "clear" ? cmd.mode : "snapshot";
      const data = await api.viteModuleGraph(cmd.filter, cmd.limit ?? 200, graphMode);
      return { ok: true, data };
    }
    if (cmd.action === "errors") {
      const data = await api.errors(Boolean(cmd.mapped), Boolean(cmd.inlineSource));
      return { ok: true, data };
    }
    if (cmd.action === "correlate-errors") {
      const errorText = String(await api.errors(Boolean(cmd.mapped), Boolean(cmd.inlineSource)));
      const events = queue ? queue.window(cmd.windowMs ?? 5000) : [];
      const fallbackHmrEvents = readTrackedHmrEvents(api, cmd.windowMs ?? 5000);
      const hmrTraceText = String(await api.viteHMRTrace("trace", 20));
      const fallbackModules = extractModules(hmrTraceText);
      const baseCorrelation =
        errorText === "no errors"
          ? null
          : correlateErrorWithHMR(errorText, [...events, ...fallbackHmrEvents] as any, cmd.windowMs ?? 5000);
      const data = formatErrorCorrelationReport(
        errorText,
        errorText === "no errors"
          ? null
          : upgradeErrorCorrelation(baseCorrelation, fallbackModules, cmd.windowMs ?? 5000),
      );
      return { ok: true, data };
    }
    if (cmd.action === "correlate-renders") {
      const events = await getSettledEventWindow(api, queue, cmd.windowMs ?? 5000);
      const data = formatPropagationTraceReport(await buildPropagationTrace(api, events, cmd.windowMs ?? 5000));
      return { ok: true, data };
    }
    if (cmd.action === "diagnose-hmr") {
      const errorText = String(await api.errors(Boolean(cmd.mapped), Boolean(cmd.inlineSource)));
      const runtimeText = String(await api.viteRuntimeStatus());
      const hmrTraceText = String(await api.viteHMRTrace("trace", cmd.limit ?? 50));
      const events = queue ? queue.window(cmd.windowMs ?? 5000) : [];
      const correlation =
        errorText === "no errors" ? null : correlateErrorWithHMR(errorText, events, cmd.windowMs ?? 5000);
      const data = formatDiagnosisReport(
        diagnoseHMR({ errorText, runtimeText, hmrTraceText, correlation }),
      );
      return { ok: true, data };
    }
    if (cmd.action === "diagnose-propagation") {
      const events = await getSettledEventWindow(api, queue, cmd.windowMs ?? 5000);
      const data = formatPropagationDiagnosisReport(
        diagnosePropagation(await buildPropagationTrace(api, events, cmd.windowMs ?? 5000)),
      );
      return { ok: true, data };
    }
    if (cmd.action === "logs") {
      const data = await api.logs();
      return { ok: true, data };
    }

    // Utilities
    if (cmd.action === "screenshot") {
      const data = await api.screenshot();
      return { ok: true, data };
    }
    if (cmd.action === "eval") {
      const data = await api.evaluate(cmd.script!);
      await settleCurrentPage(api, 120);
      await flushCurrentPageEvents(api, queue);
      await settleCurrentPage(api, 180);
      await flushCurrentPageEvents(api, queue);
      return { ok: true, data };
    }
    if (cmd.action === "network") {
      const data = await api.network(cmd.idx);
      return { ok: true, data };
    }

    return { ok: false, error: `unknown action: ${cmd.action}` };
  };
}

async function buildPropagationTrace(
  api: BrowserApi,
  events: Array<{ timestamp: number; type: string; payload: any }>,
  windowMs: number,
): Promise<PropagationTrace | null> {
  const hmrTraceText = String(await api.viteHMRTrace("trace", 20));
  const fallbackModules = extractModules(hmrTraceText);
  const trace = correlateRenderPropagation([...events, ...readTrackedHmrEvents(api, windowMs)] as any);
  if (!trace) return null;

  let augmented: PropagationTrace = trace;
  if (augmented.sourceModules.length === 0 && fallbackModules.length > 0) {
    augmented = {
      ...augmented,
      sourceModules: fallbackModules,
    };
  }

  if (augmented.changedKeys.length === 0 && augmented.storeUpdates.length > 0) {
    const inferredChangedKeys = await inferLikelyChangedKeys(api, augmented.storeUpdates[0]);
    if (inferredChangedKeys.length > 0) {
      augmented = {
        ...augmented,
        changedKeys: inferredChangedKeys,
      };
    }
  }

  if (augmented.errorMessages.length > 0) return augmented;

  const currentError = String(await api.errors(false, false));
  if (!currentError || currentError === "no errors") return augmented;

  return {
    ...augmented,
    errorMessages: [currentError, ...augmented.errorMessages],
  };
}

function upgradeErrorCorrelation(
  correlation: ReturnType<typeof correlateErrorWithHMR>,
  fallbackModules: string[],
  windowMs: number,
) {
  if (fallbackModules.length === 0) return correlation;
  if (!correlation) return synthesizeErrorCorrelation(fallbackModules, windowMs);
  if (correlation.matchingModules.length > 0) return correlation;
  return synthesizeErrorCorrelation(fallbackModules, windowMs, correlation.relatedEvents);
}

function synthesizeErrorCorrelation(
  modules: string[],
  windowMs: number,
  relatedEvents: Array<{ timestamp: number; type: "hmr-update" | "hmr-error"; payload: { path?: string; message?: string; updates?: Array<{ path?: string }> } }> = [],
) {
  if (modules.length === 0) return null;

  return {
    summary: `HMR update observed within ${windowMs}ms of the current error`,
    detail: `Matching modules: ${modules.join(", ")}\nRecent events considered: ${modules.length}`,
    confidence: "high" as const,
    windowMs,
    matchingModules: modules,
    relatedEvents:
      relatedEvents.length > 0
        ? relatedEvents
        : modules.map((module) => ({
            timestamp: Date.now(),
            type: "hmr-update" as const,
            payload: {
              path: module,
              updates: [{ path: module }],
            },
          })),
  };
}

async function inferLikelyChangedKeys(api: BrowserApi, storeName: string): Promise<string[]> {
  try {
    const raw = await api.evaluate(
      `(() => {
        const store = window.__PINIA__?._s?.get(${JSON.stringify(storeName)});
        if (!store) return [];
        return Object.keys(store).filter((key) => store[key] === undefined);
      })()`,
    );
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string" && value.length > 0) : [];
  } catch {
    return [];
  }
}

function readTrackedHmrEvents(api: BrowserApi, windowMs: number) {
  const reader = (api as Partial<Pick<BrowserApi, "getTrackedHmrEvents">>).getTrackedHmrEvents;
  if (typeof reader !== "function") return [];

  const events = reader(windowMs);
  return Array.isArray(events) ? events : [];
}

async function flushCurrentPageEvents(api: BrowserApi, queue: ReturnType<BrowserApi["getEventQueue"]>) {
  if (!queue) return;
  try {
    const currentPage = api.getCurrentPage();
    if (currentPage) {
      await api.flushBrowserEvents(currentPage, queue);
    }
  } catch {
    // Ignore flush errors (page might not be open yet)
  }
}

async function getSettledEventWindow(api: BrowserApi, queue: ReturnType<BrowserApi["getEventQueue"]>, windowMs: number) {
  if (!queue) return [];

  let events = queue.window(windowMs);
  if (hasPropagationSignals(events)) return events;

  for (const delayMs of [120, 300]) {
    await settleCurrentPage(api, delayMs);
    await flushCurrentPageEvents(api, queue);
    events = queue.window(windowMs);
    if (hasPropagationSignals(events)) return events;
  }

  return events;
}

function hasPropagationSignals(events: Array<{ type: string }>) {
  return events.some((event) => event.type === "render" || event.type === "store-update");
}

async function settleCurrentPage(api: BrowserApi, delayMs: number) {
  const currentPage = api.getCurrentPage();
  if (!currentPage) {
    await sleep(delayMs);
    return;
  }

  try {
    await currentPage.waitForTimeout(delayMs);
  } catch {
    await sleep(delayMs);
  }
}

export async function dispatchLine(
  line: string,
  socket: Pick<Socket, "write">,
  run = createRunner(),
  onClose?: () => void,
) {
  let cmd: Cmd;
  try {
    cmd = JSON.parse(line);
  } catch {
    socket.write(JSON.stringify({ ok: false, error: "invalid command payload" }) + "\n");
    return;
  }

  const result = await run(cmd).catch((err) => ({ ok: false, error: cleanError(err) }));
  socket.write(JSON.stringify({ id: cmd.id, ...result }) + "\n");
  if (cmd.action === "close") setImmediate(() => onClose?.());
}

export function startDaemon() {
  // Initialize event queue
  const eventQueue = new EventQueue(1000);
  browser.setEventQueue(eventQueue);
  networkLog.setEventQueue(eventQueue);

  const run = createRunner();
  mkdirSync(socketDir, { recursive: true, mode: 0o700 });
  removeSocketFile();
  rmSync(pidFile, { force: true });
  writeFileSync(pidFile, String(process.pid));

  const server = createServer((socket) => {
    let buffer = "";
    socket.on("data", (chunk) => {
      buffer += chunk;
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (line) {
          void dispatchLine(line, socket, run, shutdown);
        }
      }
    });
    socket.on("error", () => {});
  });

  server.listen(socketPath);

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("exit", cleanup);

  function shutdown() {
    cleanup();
    process.exit(0);
  }

  function cleanup() {
    removeSocketFile();
    rmSync(pidFile, { force: true });
  }
}

function removeSocketFile() {
  // Windows named pipes are not filesystem entries, so unlinking them fails with EPERM.
  if (process.platform === "win32") return;
  rmSync(socketPath, { force: true });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startDaemon();
}
