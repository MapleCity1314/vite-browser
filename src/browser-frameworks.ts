import type { Page } from "playwright";
import * as vueDevtools from "./vue/devtools.js";
import * as reactDevtools from "./react/devtools.js";
import * as svelteDevtools from "./svelte/devtools.js";
import type { BrowserFramework, BrowserSessionState } from "./browser-session.js";

export async function detectBrowserFramework(
  page: Page,
): Promise<{ detected: string; framework: BrowserFramework }> {
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
    state.lastReactSnapshot = await reactDevtools.snapshot(page);
    return reactDevtools.format(state.lastReactSnapshot);
  }

  const parsed = Number.parseInt(id, 10);
  if (!Number.isFinite(parsed)) throw new Error("react component id must be a number");

  const inspected = await reactDevtools.inspect(page, parsed);
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

function toBrowserFramework(detected: string): BrowserFramework {
  if (detected.startsWith("vue")) return "vue";
  if (detected.startsWith("react")) return "react";
  if (detected.startsWith("svelte")) return "svelte";
  return "unknown";
}
