import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";
import type { ReactNode } from "./react/devtools.js";

const extensionPath =
  process.env.REACT_DEVTOOLS_EXTENSION ??
  resolve(import.meta.dirname, "../../next-browser/extensions/react-devtools-chrome");

const hasReactExtension = existsSync(join(extensionPath, "manifest.json"));
const installHook = hasReactExtension
  ? readFileSync(join(extensionPath, "build", "installHook.js"), "utf-8")
  : null;

export type BrowserFramework = "vue" | "react" | "svelte" | "unknown";
export type HmrEventType = "connecting" | "connected" | "update" | "full-reload" | "error" | "log";
export type HmrEvent = { timestamp: number; type: HmrEventType; message: string; path?: string };
export type BrowserSessionState = {
  context: BrowserContext | null;
  page: Page | null;
  framework: BrowserFramework;
  extensionModeDisabled: boolean;
  consoleLogs: string[];
  hmrEvents: HmrEvent[];
  lastReactSnapshot: ReactNode[];
  lastModuleGraphUrls: string[] | null;
};

export function createBrowserSessionState(): BrowserSessionState {
  return {
    context: null,
    page: null,
    framework: "unknown",
    extensionModeDisabled: false,
    consoleLogs: [],
    hmrEvents: [],
    lastReactSnapshot: [],
    lastModuleGraphUrls: null,
  };
}

export function getCurrentPage(state: BrowserSessionState): Page | null {
  if (!contextUsable(state.context)) return null;
  if (!state.page || state.page.isClosed()) return null;
  return state.page;
}

export function resetBrowserSessionState(state: BrowserSessionState): void {
  state.context = null;
  state.page = null;
  state.framework = "unknown";
  state.consoleLogs.length = 0;
  state.hmrEvents.length = 0;
  state.lastModuleGraphUrls = null;
  state.lastReactSnapshot = [];
}

export async function ensureBrowserPage(
  state: BrowserSessionState,
  onPageReady: (page: Page) => void,
): Promise<Page> {
  if (!contextUsable(state.context)) {
    await closeBrowserSession(state);
    const launched = await launchBrowserContext(state.extensionModeDisabled);
    state.context = launched.context;
    state.extensionModeDisabled = launched.extensionModeDisabled;
  }

  if (!state.context) throw new Error("browser not open");

  if (!state.page || state.page.isClosed()) {
    try {
      state.page = state.context.pages()[0] ?? (await state.context.newPage());
    } catch (error) {
      if (!isClosedTargetError(error)) throw error;
      await closeBrowserSession(state);
      state.extensionModeDisabled = true;
      const launched = await launchBrowserContext(state.extensionModeDisabled);
      state.context = launched.context;
      state.extensionModeDisabled = launched.extensionModeDisabled;
      state.page = state.context.pages()[0] ?? (await state.context.newPage());
    }
    onPageReady(state.page);
  }

  return state.page;
}

export async function closeBrowserSession(state: BrowserSessionState): Promise<void> {
  await state.context?.close();
  resetBrowserSessionState(state);
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

async function launchBrowserContext(
  extensionModeDisabled: boolean,
): Promise<{ context: BrowserContext; extensionModeDisabled: boolean }> {
  if (hasReactExtension && installHook && !extensionModeDisabled) {
    try {
      const context = await chromium.launchPersistentContext("", {
        headless: false,
        viewport: { width: 1280, height: 720 },
        args: [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`,
          "--auto-open-devtools-for-tabs",
        ],
      });
      await context.waitForEvent("serviceworker").catch(() => {});
      await context.addInitScript(installHook);
      return { context, extensionModeDisabled };
    } catch {
      extensionModeDisabled = true;
    }
  }

  const browser = await chromium.launch({
    headless: false,
    args: ["--auto-open-devtools-for-tabs"],
  });
  return {
    context: await browser.newContext({ viewport: { width: 1280, height: 720 } }),
    extensionModeDisabled,
  };
}
