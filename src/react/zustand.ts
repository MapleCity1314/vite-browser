/**
 * Zustand state management integration
 *
 * Detects Zustand stores and provides state inspection capabilities.
 */

import type { Page } from "playwright";

export interface ZustandStore {
  name: string;
  state: Record<string, unknown>;
  actions: string[];
}

/**
 * Detect if Zustand is present in the page
 */
export async function detectZustand(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    // Check for Zustand stores in window
    const win = window as any;
    return !!(win.__ZUSTAND_STORES__ || win.zustandStores);
  });
}

/**
 * List all Zustand stores
 */
export async function listStores(page: Page): Promise<string[]> {
  return page.evaluate(inPageListStores);
}

/**
 * Inspect a specific Zustand store
 */
export async function inspectStore(page: Page, storeName: string): Promise<ZustandStore | null> {
  return page.evaluate(inPageInspectStore, storeName);
}

/**
 * Format Zustand store list for CLI output
 */
export function formatStoreList(stores: string[]): string {
  if (stores.length === 0) return "No Zustand stores found";

  const lines: string[] = ["# Zustand Stores\n"];
  stores.forEach((name) => lines.push(`- ${name}`));
  lines.push("\nUse 'vite-browser react store inspect <name>' to view store details");
  return lines.join("\n");
}

/**
 * Format Zustand store inspection for CLI output
 */
export function formatStoreInspection(store: ZustandStore): string {
  const lines: string[] = [`# Zustand Store: ${store.name}\n`];

  // State section
  if (Object.keys(store.state).length > 0) {
    lines.push("## State");
    for (const [key, value] of Object.entries(store.state)) {
      if (typeof value === "function") continue;
      lines.push(`  ${key}: ${safeJson(value)}`);
    }
    lines.push("");
  }

  // Actions section
  if (store.actions.length > 0) {
    lines.push("## Actions");
    for (const action of store.actions) {
      lines.push(`  ${action}()`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function safeJson(value: unknown): string {
  try {
    const seen = new WeakSet<object>();
    return JSON.stringify(value, (_, v) => {
      if (v && typeof v === "object") {
        if (seen.has(v as object)) return "[Circular]";
        seen.add(v as object);
      }
      return v;
    });
  } catch {
    return String(value);
  }
}

// In-page functions

function inPageListStores(): string[] {
  const win = window as any;
  const stores = win.__ZUSTAND_STORES__ || win.zustandStores || {};
  return Object.keys(stores);
}

function inPageInspectStore(storeName: string): ZustandStore | null {
  const win = window as any;
  const stores = win.__ZUSTAND_STORES__ || win.zustandStores || {};
  const store = stores[storeName];

  if (!store) return null;

  // Get current state
  const state = store.getState?.() || store.getInitialState?.() || {};

  // Extract actions (functions in the state)
  const actions: string[] = [];
  for (const [key, value] of Object.entries(state)) {
    if (typeof value === "function") {
      actions.push(key);
    }
  }

  // Filter out functions from state display
  const stateWithoutFunctions: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(state)) {
    if (typeof value !== "function") {
      stateWithoutFunctions[key] = value;
    }
  }

  return {
    name: storeName,
    state: stateWithoutFunctions,
    actions,
  };
}
