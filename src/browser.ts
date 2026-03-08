import { existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";
import * as vueDevtools from "./vue/devtools.js";
import * as reactDevtools from "./react/devtools.js";
import * as svelteDevtools from "./svelte/devtools.js";
import * as networkLog from "./network.js";

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

const consoleLogs: string[] = [];
const MAX_LOGS = 200;
let lastReactSnapshot: reactDevtools.ReactNode[] = [];

export async function open(url: string | undefined) {
  const currentPage = await ensurePage();

  if (url) {
    await currentPage.goto(url, { waitUntil: "domcontentloaded" });
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

function contextUsable(current: BrowserContext | null): current is BrowserContext {
  if (!current) return false;
  try {
    current.pages();
    return true;
  } catch {
    return false;
  }
}

function isClosedTargetError(error: unknown): boolean {
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
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(text);
    if (consoleLogs.length > MAX_LOGS) consoleLogs.shift();
  });
}

export async function goto(url: string) {
  const currentPage = await ensurePage();
  await currentPage.goto(url, { waitUntil: "domcontentloaded" });
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

  return page.evaluate(() => {
    const updates = (window as any).__vite_hmr_updates || [];
    if (updates.length === 0) return "No HMR updates";

    return updates
      .slice(-20)
      .map((u: any) => `${new Date(u.timestamp).toLocaleTimeString()} - ${u.path}`)
      .join("\n");
  });
}

export async function errors(): Promise<string> {
  if (!page) throw new Error("browser not open");

  const errorInfo = await page.evaluate(() => {
    const overlay = document.querySelector("vite-error-overlay");
    if (!overlay || !overlay.shadowRoot) return null;

    const message = overlay.shadowRoot.querySelector(".message")?.textContent?.trim();
    const stack = overlay.shadowRoot.querySelector(".stack")?.textContent?.trim();

    return { message, stack };
  });

  if (!errorInfo) return "no errors";
  return `${errorInfo.message ?? "Vite error"}\n\n${errorInfo.stack ?? ""}`.trim();
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
