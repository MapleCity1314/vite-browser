/**
 * React DevTools Hook Management
 *
 * Provides health checks and injection helpers for the bundled React DevTools hook.
 * This removes the dependency on external browser extensions for React inspection.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Page } from "playwright";

/** Path to the bundled React DevTools hook */
const hookPath = resolve(import.meta.dirname, "./hook.js");

/** Cached hook source code */
let hookSource: string | null = null;

/**
 * Get the hook source code, lazily loaded and cached
 */
export function getHookSource(): string {
  if (!hookSource) {
    hookSource = readFileSync(hookPath, "utf-8");
  }
  return hookSource;
}

export interface HookHealthStatus {
  installed: boolean;
  hasRenderers: boolean;
  rendererCount: number;
  hasFiberSupport: boolean;
}

/**
 * Check the health of the React DevTools hook in the page
 */
export async function checkHookHealth(page: Page): Promise<HookHealthStatus> {
  return page.evaluate(inPageCheckHookHealth);
}

/**
 * Inject the React DevTools hook into a page if not already present.
 */
export async function injectHook(page: Page): Promise<boolean> {
  const alreadyInstalled = await page.evaluate(
    () => !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
  );

  if (alreadyInstalled) return false;

  await page.evaluate(getHookSource());
  return true;
}

/**
 * Format hook health status for CLI output
 */
export function formatHookHealth(status: HookHealthStatus): string {
  const lines: string[] = ["# React DevTools Hook Status\n"];

  lines.push(`Installed: ${status.installed ? "✅ Yes" : "❌ No"}`);
  lines.push(`Fiber support: ${status.hasFiberSupport ? "✅ Yes" : "❌ No"}`);
  lines.push(`Renderers: ${status.rendererCount}`);
  lines.push(`Has renderers: ${status.hasRenderers ? "✅ Yes" : "❌ No"}`);

  if (!status.installed) {
    lines.push("\n⚠️ Hook not installed. React DevTools features will not work.");
    lines.push("The hook should be injected before React loads.");
  } else if (!status.hasRenderers) {
    lines.push("\n⚠️ No React renderers detected.");
    lines.push("This page may not be using React, or React hasn't mounted yet.");
  }

  return lines.join("\n");
}

// In-page functions

function inPageCheckHookHealth(): HookHealthStatus {
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (!hook) {
    return {
      installed: false,
      hasRenderers: false,
      rendererCount: 0,
      hasFiberSupport: false,
    };
  }

  const rendererCount = hook.renderers?.size ?? 0;

  return {
    installed: true,
    hasRenderers: rendererCount > 0,
    rendererCount,
    hasFiberSupport: !!hook.supportsFiber,
  };
}
