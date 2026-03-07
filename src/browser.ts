/**
 * Browser manager — single headed Chromium instance with Vue/React DevTools.
 *
 * Launches via Playwright with DevTools extensions pre-loaded.
 * Supports Vue, React, and other Vite-based frameworks.
 */

import { chromium, type BrowserContext, type Page } from "playwright";
import { tmpdir } from "node:os";
import { join } from "node:path";

let context: BrowserContext | null = null;
let page: Page | null = null;
let framework: "vue" | "react" | "svelte" | "unknown" = "unknown";

// Console logs buffer
const consoleLogs: string[] = [];
const MAX_LOGS = 100;

// Network requests buffer
interface NetworkRequest {
  url: string;
  method: string;
  status?: number;
  timestamp: number;
}
const networkRequests: NetworkRequest[] = [];
const MAX_REQUESTS = 50;

// ── Browser lifecycle ────────────────────────────────────────────────────────

export async function open(url: string | undefined) {
  if (!context) {
    context = await launch();
    page = context.pages()[0] ?? (await context.newPage());
    attachListeners(page);
  }
  if (url) {
    await page!.goto(url, { waitUntil: "domcontentloaded" });
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
  networkRequests.length = 0;
}

async function launch(): Promise<BrowserContext> {
  const browser = await chromium.launch({
    headless: false,
    args: ["--auto-open-devtools-for-tabs"],
  });
  return await browser.newContext({
    viewport: { width: 1280, height: 720 },
  });
}

function attachListeners(page: Page) {
  // Console logs
  page.on("console", (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(text);
    if (consoleLogs.length > MAX_LOGS) consoleLogs.shift();
  });

  // Network requests
  page.on("response", (response) => {
    const req = response.request();
    networkRequests.push({
      url: req.url(),
      method: req.method(),
      status: response.status(),
      timestamp: Date.now(),
    });
    if (networkRequests.length > MAX_REQUESTS) networkRequests.shift();
  });
}

// ── Navigation ───────────────────────────────────────────────────────────────

export async function goto(url: string) {
  if (!page) throw new Error("browser not open");
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await detectFramework();
  return page.url();
}

export async function back() {
  if (!page) throw new Error("browser not open");
  await page.goBack();
}

export async function reload() {
  if (!page) throw new Error("browser not open");
  await page.reload();
  return page.url();
}

// ── Framework detection ──────────────────────────────────────────────────────

export async function detectFramework(): Promise<string> {
  if (!page) throw new Error("browser not open");

  const detected = await page.evaluate(() => {
    // Check for Vue
    if ((window as any).__VUE__ || (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__) {
      const vueVersion = (window as any).__VUE__?.version || "unknown";
      return `vue@${vueVersion}`;
    }
    // Check for React
    if ((window as any).React || document.querySelector("[data-reactroot]")) {
      const reactVersion = (window as any).React?.version || "unknown";
      return `react@${reactVersion}`;
    }
    // Check for Svelte
    if ((window as any).__SVELTE__) {
      return "svelte";
    }
    return "unknown";
  });

  // Update framework state based on detection
  if (detected.startsWith("vue")) framework = "vue";
  else if (detected.startsWith("react")) framework = "react";
  else if (detected === "svelte") framework = "svelte";
  else framework = "unknown";

  return detected;
}

// ── Vue commands ─────────────────────────────────────────────────────────────

export async function vueTree(id?: string): Promise<string> {
  if (!page) throw new Error("browser not open");

  // TODO: Implement Vue component tree using @vue/devtools-kit
  return "Vue component tree - TODO";
}

export async function vuePinia(store?: string): Promise<string> {
  if (!page) throw new Error("browser not open");

  // TODO: Implement Pinia store inspection
  return "Pinia stores - TODO";
}

export async function vueRouter(): Promise<string> {
  if (!page) throw new Error("browser not open");

  const routerInfo = await page.evaluate(() => {
    const router = (window as any).$router || (window as any).__VUE_ROUTER__;
    if (!router) return null;

    return {
      currentRoute: router.currentRoute?.value?.path || router.currentRoute?.path,
      routes: router.getRoutes?.().map((r: any) => r.path) || [],
    };
  });

  if (!routerInfo) return "Vue Router not found";

  return `Current route: ${routerInfo.currentRoute}\nRoutes: ${routerInfo.routes.join(", ")}`;
}

// ── React commands ───────────────────────────────────────────────────────────

export async function reactTree(id?: string): Promise<string> {
  if (!page) throw new Error("browser not open");

  // TODO: Implement React component tree (copy from next-browser)
  return "React component tree - TODO";
}

// ── Vite commands ────────────────────────────────────────────────────────────

export async function viteRestart(): Promise<string> {
  if (!page) throw new Error("browser not open");

  // Try to restart Vite dev server
  // This requires a Vite plugin to expose a restart endpoint
  const result = await page.evaluate(async () => {
    try {
      const response = await fetch("/__vite_restart", { method: "POST" });
      return response.ok ? "restarted" : "restart endpoint not available";
    } catch {
      return "restart endpoint not available (install vite-browser plugin)";
    }
  });

  return result;
}

export async function viteHMR(): Promise<string> {
  if (!page) throw new Error("browser not open");

  const hmrStatus = await page.evaluate(() => {
    const hmr = (window as any).__vite_hmr_updates || [];
    if (hmr.length === 0) return "No HMR updates";

    return hmr
      .slice(-10)
      .map((u: any) => `${new Date(u.timestamp).toLocaleTimeString()} - ${u.path}`)
      .join("\n");
  });

  return hmrStatus;
}

export async function errors(): Promise<string> {
  if (!page) throw new Error("browser not open");

  const errorInfo = await page.evaluate(() => {
    const overlay = document.querySelector("vite-error-overlay");
    if (!overlay || !overlay.shadowRoot) return null;

    const message = overlay.shadowRoot.querySelector(".message")?.textContent;
    const stack = overlay.shadowRoot.querySelector(".stack")?.textContent;

    return { message, stack };
  });

  if (!errorInfo) return "no errors";

  return `${errorInfo.message}\n\n${errorInfo.stack}`;
}

export async function logs(): Promise<string> {
  if (consoleLogs.length === 0) return "no logs";
  return consoleLogs.slice(-20).join("\n");
}

// ── Utilities ────────────────────────────────────────────────────────────────

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
  if (idx !== undefined) {
    const req = networkRequests[idx];
    if (!req) return "request not found";
    return JSON.stringify(req, null, 2);
  }

  if (networkRequests.length === 0) return "no network requests";

  return networkRequests
    .map((req, i) => `[${i}] ${req.method} ${req.url} (${req.status})`)
    .join("\n");
}
