import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "playwright";
import { initBrowserEventCollector, readBrowserEvents } from "./browser-collector.js";
import {
  detectBrowserFramework,
  inspectReactTree,
  inspectSvelteTree,
  inspectVuePinia,
  inspectVueRouter,
  inspectVueTree,
} from "./browser-frameworks.js";
import {
  closeBrowserSession,
  createBrowserSessionState,
  ensureBrowserPage,
  getCurrentPage as getSessionPage,
  type HmrEvent,
  type RuntimeError,
} from "./browser-session.js";
import {
  collectModuleRows,
  formatHmrTrace,
  formatModuleGraphSnapshot,
  formatModuleGraphTrace,
  formatRuntimeStatus,
  readOverlayError,
  readRuntimeSnapshot,
} from "./browser-vite.js";
import * as networkLog from "./network.js";
import { resolveViaSourceMap } from "./sourcemap.js";
import { EventQueue } from "./event-queue.js";

export { contextUsable, isClosedTargetError, type HmrEvent } from "./browser-session.js";
export {
  formatHmrTrace,
  formatModuleGraphSnapshot,
  formatModuleGraphTrace,
  formatRuntimeStatus,
  normalizeLimit,
  type ModuleRow,
  type RuntimeSnapshot,
} from "./browser-vite.js";
const session = createBrowserSessionState();
let eventQueue: EventQueue | null = null;
const MAX_LOGS = 200;
const MAX_HMR_EVENTS = 500;
const MAX_RUNTIME_ERRORS = 50;
export type ModuleGraphMode = "snapshot" | "trace" | "clear";

export function setEventQueue(queue: EventQueue): void {
  eventQueue = queue;
}

export function getEventQueue(): EventQueue | null {
  return eventQueue;
}

export function getCurrentPage(): Page | null {
  return getSessionPage(session);
}

/**
 * Inject browser-side event collector into the page
 */
async function injectEventCollector(currentPage: Page): Promise<void> {
  if (session.context && !session.collectorInstalled) {
    await session.context.addInitScript(initBrowserEventCollector);
    session.collectorInstalled = true;
  }
  await currentPage.evaluate(initBrowserEventCollector);
}

/**
 * Flush browser events into daemon event queue
 */
export async function flushBrowserEvents(currentPage: Page, queue: EventQueue): Promise<void> {
  await currentPage.evaluate(initBrowserEventCollector);
  const raw = await currentPage.evaluate(readBrowserEvents);
  for (const e of raw) {
    queue.push(e);
  }
}

export async function open(url: string | undefined) {
  const currentPage = await ensurePage();

  if (url) {
    await navigateAndRefreshContext(currentPage, () => currentPage.goto(url, { waitUntil: "domcontentloaded" }), true);
  }
}

export async function cookies(cookies: { name: string; value: string }[], domain: string) {
  if (!session.context) throw new Error("browser not open");
  await session.context.addCookies(
    cookies.map((c) => ({ name: c.name, value: c.value, domain, path: "/" })),
  );
  return cookies.length;
}

export async function close() {
  await closeBrowserSession(session);
  networkLog.clear();
}

async function ensurePage(): Promise<Page> {
  return ensureBrowserPage(session, (currentPage) => {
    attachListeners(currentPage);
    networkLog.attach(currentPage);
  });
}

function attachListeners(currentPage: Page) {
  currentPage.on("console", (msg) => {
    const type = msg.type();
    const message = msg.text();
    recordConsoleMessage(session.consoleLogs, session.hmrEvents, type, message);

    if (type === "error" || isVueUnhandledWarning(type, message)) {
      recordRuntimeError(session.runtimeErrors, message, undefined, undefined, undefined, undefined);
    }
  });

  currentPage.on("pageerror", (error) => {
    recordRuntimeError(session.runtimeErrors, error.message, error.stack, undefined, undefined, undefined, "pageerror");
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

export function recordRuntimeError(
  runtimeErrors: RuntimeError[],
  message: string,
  stack?: string,
  source?: string | null,
  line?: number | null,
  col?: number | null,
  logType = "runtime-error",
  maxErrors = MAX_RUNTIME_ERRORS,
) {
  const error: RuntimeError = {
    timestamp: Date.now(),
    message,
    stack,
    source,
    line,
    col,
  };
  runtimeErrors.push(error);
  if (runtimeErrors.length > maxErrors) runtimeErrors.shift();

  eventQueue?.push({
    timestamp: error.timestamp,
    type: "error",
    payload: {
      message,
      stack,
      source,
      line,
      col,
    },
  });

  const details = stack ? `${message}\n${stack}` : message;
  session.consoleLogs.push(`[${logType}] ${details}`);
  if (session.consoleLogs.length > MAX_LOGS) session.consoleLogs.shift();
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

export async function goto(url: string) {
  const currentPage = await ensurePage();
  await navigateAndRefreshContext(currentPage, () => currentPage.goto(url, { waitUntil: "domcontentloaded" }), true);
  return currentPage.url();
}

export async function back() {
  const currentPage = await ensurePage();
  await currentPage.goBack({ waitUntil: "domcontentloaded" });
}

export async function reload() {
  const currentPage = await ensurePage();
  await navigateAndRefreshContext(currentPage, () => currentPage.reload({ waitUntil: "domcontentloaded" }));
  return currentPage.url();
}

export async function detectFramework(): Promise<string> {
  const currentPage = requireCurrentPage();
  const result = await detectBrowserFramework(currentPage);
  session.framework = result.framework;

  return result.detected;
}

export async function vueTree(id?: string): Promise<string> {
  return inspectVueTree(requireCurrentPage(), id);
}

export async function vuePinia(store?: string): Promise<string> {
  return inspectVuePinia(requireCurrentPage(), store);
}

export async function vueRouter(): Promise<string> {
  return inspectVueRouter(requireCurrentPage());
}

export async function reactTree(id?: string): Promise<string> {
  return inspectReactTree(session, requireCurrentPage(), id);
}

export async function svelteTree(id?: string): Promise<string> {
  return inspectSvelteTree(requireCurrentPage(), id);
}

export async function viteRestart(): Promise<string> {
  const currentPage = requireCurrentPage();

  return currentPage.evaluate(async () => {
    try {
      const response = await fetch("/__vite_restart", { method: "POST" });
      return response.ok ? "restarted" : "restart endpoint not available";
    } catch {
      return "restart endpoint not available (install vite-browser plugin)";
    }
  });
}

export async function viteHMR(): Promise<string> {
  requireCurrentPage();
  return viteHMRTrace("summary", 20);
}

export async function viteRuntimeStatus(): Promise<string> {
  const currentPage = requireCurrentPage();
  const runtime = await readRuntimeSnapshot(currentPage);

  return formatRuntimeStatus(runtime, session.framework, session.hmrEvents);
}

export async function viteHMRTrace(mode: "summary" | "trace" | "clear", limit = 20): Promise<string> {
  const currentPage = requireCurrentPage();

  if (mode === "clear") {
    session.hmrEvents.length = 0;
    return "cleared HMR trace";
  }

  if (session.hmrEvents.length === 0) {
    const fallback = await currentPage.evaluate(() => {
      const updates = (window as any).__vite_hmr_updates || [];
      return updates.slice(-20).map((u: any) => ({
        timestamp: u.timestamp ?? Date.now(),
        type: "update" as const,
        message: u.path ? `[vite] hot updated: ${u.path}` : "[vite] hot updated",
        path: u.path,
      }));
    });
    if (fallback.length > 0) session.hmrEvents.push(...fallback);
  }

  if (session.hmrEvents.length === 0) return "No HMR updates";
  return formatHmrTrace(mode, session.hmrEvents, limit);
}

export async function viteModuleGraph(
  filter?: string,
  limit = 200,
  mode: ModuleGraphMode = "snapshot",
): Promise<string> {
  const currentPage = requireCurrentPage();

  if (mode === "clear") {
    session.lastModuleGraphUrls = null;
    return "cleared module-graph baseline";
  }

  const moduleRows = await collectModuleRows(currentPage);
  const currentUrls = moduleRows.map((row) => row.url);
  const previousUrls = session.lastModuleGraphUrls ? new Set(session.lastModuleGraphUrls) : null;
  session.lastModuleGraphUrls = [...currentUrls];

  if (mode === "trace") {
    return formatModuleGraphTrace(currentUrls, previousUrls, filter, limit);
  }

  return formatModuleGraphSnapshot(moduleRows, filter, limit);
}

export async function errors(mapped = false, inlineSource = false): Promise<string> {
  const currentPage = requireCurrentPage();
  const errorInfo = await readOverlayError(currentPage);
  const runtimeError = session.runtimeErrors[session.runtimeErrors.length - 1];

  if (!errorInfo && !runtimeError) return "no errors";

  const raw = errorInfo
    ? `${errorInfo.message ?? "Vite error"}\n\n${errorInfo.stack ?? ""}`.trim()
    : formatRuntimeError(runtimeError!);
  if (!mapped) return raw;

  const origin = new URL(currentPage.url()).origin;
  const mappedStack = await mapStackTrace(raw, origin, inlineSource);
  return mappedStack;
}

function formatRuntimeError(error: RuntimeError): string {
  const location =
    error.source && error.line != null && error.col != null
      ? `\n\nat ${error.source}:${error.line}:${error.col}`
      : "";
  return `${error.message}${location}${error.stack ? `\n\n${error.stack}` : ""}`.trim();
}

function isVueUnhandledWarning(type: string, message: string): boolean {
  if (type !== "warning") return false;
  return /\[Vue warn\]: Unhandled error during execution/i.test(message);
}

export async function logs(): Promise<string> {
  if (session.consoleLogs.length === 0) return "no logs";
  return session.consoleLogs.slice(-50).join("\n");
}

export async function screenshot(): Promise<string> {
  const currentPage = requireCurrentPage();
  const path = join(tmpdir(), `vite-browser-${Date.now()}.png`);
  await currentPage.screenshot({ path, fullPage: true });
  return path;
}

export async function evaluate(script: string): Promise<string> {
  const currentPage = requireCurrentPage();
  await currentPage.evaluate(initBrowserEventCollector);
  const result = await currentPage.evaluate(script);
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

function requireCurrentPage(): Page {
  const currentPage = getCurrentPage();
  if (!currentPage) throw new Error("browser not open");
  return currentPage;
}

async function navigateAndRefreshContext(
  currentPage: Page,
  navigate: () => Promise<unknown>,
  refreshFramework = false,
): Promise<void> {
  await navigate();
  await injectEventCollector(currentPage);
  if (refreshFramework) {
    await detectFramework();
  }
}
