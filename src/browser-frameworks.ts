import type { Page } from "playwright";
import * as vueDevtools from "./vue/devtools.js";
import * as reactDevtools from "./react/devtools.js";
import { checkHookHealth, injectHook } from "./react/hook-manager.js";
import * as svelteDevtools from "./svelte/devtools.js";
import type { BrowserFramework, BrowserSessionState } from "./browser-session.js";

export function detectFrameworkFromGlobals(globals: {
  vueVersion?: string | null;
  hasVueHook?: boolean;
  hasVueAppMarker?: boolean;
  hasReactGlobal?: boolean;
  hasReactRootMarker?: boolean;
  reactRendererVersion?: string | null;
  svelteVersion?: string | null;
  hasSvelteHook?: boolean;
}): string {
  if (globals.vueVersion || globals.hasVueHook || globals.hasVueAppMarker) {
    return `vue@${globals.vueVersion || "unknown"}`;
  }

  if (globals.reactRendererVersion || globals.hasReactGlobal || globals.hasReactRootMarker) {
    return `react@${globals.reactRendererVersion || "unknown"}`;
  }

  if (globals.svelteVersion || globals.hasSvelteHook) {
    return `svelte@${globals.svelteVersion || "unknown"}`;
  }

  return "unknown";
}

export async function detectBrowserFramework(
  page: Page,
): Promise<{ detected: string; framework: BrowserFramework }> {
  await page.waitForFunction?.(
    () =>
      Boolean(
        (window as any).__VUE__ ||
        (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__ ||
        (window as any).React ||
        (window as any).__SVELTE__ ||
        (window as any).__svelte ||
        document.querySelector("[data-v-app]") ||
        (document.querySelector("#app") as any)?.__vue_app__ ||
        document.querySelector("[data-reactroot]"),
      ),
    undefined,
    { timeout: 1_000 },
  ).catch(() => {});

  const detected = await page.evaluate(() => {
    const reactHook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
    const firstRenderer = reactHook?.renderers?.values?.().next?.().value ?? null;
    const globals = {
      vueVersion: (window as any).__VUE__?.version ?? null,
      hasVueHook: Boolean((window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__),
      hasVueAppMarker: Boolean(
        (document.querySelector("#app") as any)?.__vue_app__ ||
        (document.querySelector("[data-v-app]") as any)?.__vue_app__ ||
        document.querySelector("[data-v-app]"),
      ),
      hasReactGlobal: Boolean((window as any).React),
      hasReactRootMarker: Boolean(document.querySelector("[data-reactroot]")),
      reactRendererVersion: firstRenderer?.version ?? (window as any).React?.version ?? null,
      svelteVersion: (window as any).__SVELTE__?.VERSION || (window as any).__svelte?.version || null,
      hasSvelteHook: Boolean((window as any).__SVELTE_DEVTOOLS_GLOBAL_HOOK__),
    };

    if (globals.vueVersion || globals.hasVueHook || globals.hasVueAppMarker) {
      return `vue@${globals.vueVersion || "unknown"}`;
    }

    if (globals.reactRendererVersion || globals.hasReactGlobal || globals.hasReactRootMarker) {
      return `react@${globals.reactRendererVersion || "unknown"}`;
    }

    if (globals.svelteVersion || globals.hasSvelteHook) {
      return `svelte@${globals.svelteVersion || "unknown"}`;
    }

    return "unknown";
  });

  return {
    detected,
    framework: toBrowserFramework(detected),
  };
}

export async function inspectVueTree(page: Page, id?: string): Promise<string> {
  return id ? vueDevtools.getComponentDetails(page, id) : vueDevtools.getComponentTree(page);
}

export async function inspectVuePinia(page: Page, store?: string): Promise<string> {
  return vueDevtools.getPiniaStores(page, store);
}

export async function inspectVueRouter(page: Page): Promise<string> {
  return vueDevtools.getRouterInfo(page);
}

export async function inspectReactTree(state: BrowserSessionState, page: Page, id?: string): Promise<string> {
  if (!id) {
    state.lastReactSnapshot = await withReactInspectorRecovery(page, () => reactDevtools.snapshot(page));
    return reactDevtools.format(state.lastReactSnapshot);
  }

  const parsed = Number.parseInt(id, 10);
  if (!Number.isFinite(parsed)) throw new Error("react component id must be a number");

  const inspected = await withReactInspectorRecovery(page, () => reactDevtools.inspect(page, parsed));
  const lines: string[] = [];

  const componentPath = reactDevtools.path(state.lastReactSnapshot, parsed);
  if (componentPath) lines.push(`path: ${componentPath}`);

  lines.push(inspected.text);
  if (inspected.source) {
    const [file, line, column] = inspected.source;
    lines.push(`source: ${file}:${line}:${column}`);
  }

  return lines.join("\n");
}

export async function inspectSvelteTree(page: Page, id?: string): Promise<string> {
  return id ? svelteDevtools.getComponentDetails(page, id) : svelteDevtools.getComponentTree(page);
}

async function withReactInspectorRecovery<T>(page: Page, read: () => Promise<T>): Promise<T> {
  try {
    return await read();
  } catch (error) {
    if (!isRecoverableReactInspectorError(error)) throw error;

    const health = await checkHookHealth(page);
    if (!health.installed) {
      await injectHook(page);
    }

    await page.waitForTimeout(60).catch(() => {});
    return read();
  }
}

function isRecoverableReactInspectorError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /hook not installed|no React renderer attached/i.test(error.message);
}

function toBrowserFramework(detected: string): BrowserFramework {
  if (detected.startsWith("vue")) return "vue";
  if (detected.startsWith("react")) return "react";
  if (detected.startsWith("svelte")) return "svelte";
  return "unknown";
}
