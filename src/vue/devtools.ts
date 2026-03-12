/**
 * Vue DevTools integration
 *
 * Uses @vue/devtools-kit to access Vue component tree and state
 */

import type { Page } from "playwright";

export interface VueComponent {
  id: string;
  name: string;
  type: string;
  file?: string;
  line?: number;
}

export function formatComponentTree(apps: any[], maxDepth = 50): string {
  if (apps.length === 0) return "No Vue apps found";

  const output: string[] = [];
  output.push("# Vue Component Tree");
  output.push(`# ${apps.length} app(s) detected\n`);

  apps.forEach((app: any, appIndex: number) => {
    const appName =
      app._component?.name || app.config?.globalProperties?.$options?.name || `App ${appIndex}`;
    output.push(`## App: ${appName}`);

    const rootInstance = app._instance || app._container?._vnode?.component;
    if (!rootInstance) {
      output.push("  (no root instance)");
      return;
    }

    const seen = new WeakSet<object>();
    const visit = (instance: any, depth = 0) => {
      if (!instance || typeof instance !== "object") return;
      if (seen.has(instance)) return;
      if (depth > maxDepth) {
        output.push(`${"  ".repeat(depth)}[max depth reached]`);
        return;
      }
      seen.add(instance);

      const indent = "  ".repeat(depth);
      const name = instance.type?.name || instance.type?.__name || "Anonymous";
      const uid = instance.uid ?? "?";
      const file = instance.type?.__file;
      const fileSuffix = file ? ` [${file}]` : "";
      output.push(`${indent}[${uid}] ${name}${fileSuffix}`);

      const subTree = instance.subTree;
      if (subTree?.component) visit(subTree.component, depth + 1);
      if (Array.isArray(subTree?.children)) {
        subTree.children.forEach((child: any) => {
          if (child?.component) visit(child.component, depth + 1);
        });
      }
      if (Array.isArray(instance.children)) {
        instance.children.forEach((child: any) => visit(child, depth + 1));
      }
    };

    visit(rootInstance, 1);
    output.push("");
  });

  return output.join("\n");
}

export function formatComponentDetails(targetInstance: any, componentId: string): string {
  if (!targetInstance) return `Component ${componentId} not found`;

  const output: string[] = [];
  const name = targetInstance.type?.name || targetInstance.type?.__name || "Anonymous";

  output.push(`# Component: ${name}`);
  output.push(`# UID: ${targetInstance.uid}\n`);

  if (targetInstance.props && Object.keys(targetInstance.props).length > 0) {
    output.push("## Props");
    for (const [key, value] of Object.entries(targetInstance.props)) {
      output.push(`  ${key}: ${JSON.stringify(value)}`);
    }
    output.push("");
  }

  if (targetInstance.data && Object.keys(targetInstance.data).length > 0) {
    output.push("## Data");
    for (const [key, value] of Object.entries(targetInstance.data)) {
      output.push(`  ${key}: ${JSON.stringify(value)}`);
    }
    output.push("");
  }

  const setupState = targetInstance.setupState || targetInstance.devtoolsRawSetupState;
  if (setupState && Object.keys(setupState).length > 0) {
    output.push("## Setup State");
    for (const [key, value] of Object.entries(setupState)) {
      output.push(`  ${key}: ${typeof value === "function" ? "[Function]" : JSON.stringify(value)}`);
    }
    output.push("");
  }

  const computed = targetInstance.type?.computed;
  if (computed && Object.keys(computed).length > 0) {
    output.push("## Computed");
    for (const key of Object.keys(computed)) {
      try {
        const value = targetInstance.proxy?.[key];
        output.push(`  ${key}: ${JSON.stringify(value)}`);
      } catch {
        output.push(`  ${key}: [Error]`);
      }
    }
    output.push("");
  }

  const file = targetInstance.type?.__file;
  if (file) {
    output.push("## Source");
    output.push(`  ${file}`);
  }

  return output.join("\n");
}

export function formatPiniaStores(
  pinia: any,
  storeName?: string,
  piniaFromWindow = true,
): string {
  if (!pinia && piniaFromWindow) return "Pinia not found";

  const safeJson = (value: unknown): string => {
    if (typeof value === "function") return "[Function]";
    if (typeof value === "bigint") return value.toString();
    const seen = new WeakSet<object>();
    try {
      return JSON.stringify(value, (_, v) => {
        if (typeof v === "function") return "[Function]";
        if (typeof v === "bigint") return v.toString();
        if (v && typeof v === "object") {
          if (seen.has(v as object)) return "[Circular]";
          seen.add(v as object);
        }
        return v;
      });
    } catch {
      return String(value);
    }
  };

  const storesById: Record<string, any> = {};
  const registry = pinia?._s;
  if (registry instanceof Map) {
    registry.forEach((store, id) => {
      storesById[String(id)] = store;
    });
  } else if (registry && typeof registry === "object") {
    for (const [id, store] of Object.entries(registry)) {
      storesById[id] = store;
    }
  }

  const stateById =
    pinia?.state?.value && typeof pinia.state.value === "object" ? pinia.state.value : {};
  const storeKeys = Array.from(new Set([...Object.keys(storesById), ...Object.keys(stateById)]));

  if (storeKeys.length === 0) return "No Pinia stores found";

  const output: string[] = [];
  if (!storeName) {
    output.push("# Pinia Stores\n");
    storeKeys.forEach((key) => output.push(`- ${key}`));
    output.push("\nUse 'vite-browser vue pinia <store-name>' to inspect a specific store");
    return output.join("\n");
  }

  const store = storesById[storeName] ?? null;
  const stateOnly = (stateById as Record<string, unknown>)[storeName];
  if (!store && !stateOnly) return `Store '${storeName}' not found`;

  output.push(`# Pinia Store: ${storeName}\n`);

  const state = store?.$state || store?.state || stateOnly || store;
  if (state && typeof state === "object") {
    output.push("## State");
    for (const [key, value] of Object.entries(state)) {
      if (key.startsWith("$")) continue;
      output.push(`  ${key}: ${safeJson(value)}`);
    }
    output.push("");
  }

  const getterNames: string[] = [];
  const rawGetters = store?._getters;
  if (Array.isArray(rawGetters)) getterNames.push(...rawGetters.map((g: unknown) => String(g)));
  else if (rawGetters instanceof Set) getterNames.push(...Array.from(rawGetters).map(String));
  else if (rawGetters && typeof rawGetters === "object") getterNames.push(...Object.keys(rawGetters));

  const getterSet = new Set(getterNames);

  if (getterNames.length > 0) {
    output.push("## Getters");
    for (const key of getterNames) {
      try {
        output.push(`  ${key}: ${safeJson(store[key])}`);
      } catch {
        output.push(`  ${key}: [Error]`);
      }
    }
    output.push("");
  }

  // List actions (own functions on the store, excluding $ prefixed internals)
  const actionNames: string[] = [];
  if (store && typeof store === "object") {
    for (const key of Object.keys(store)) {
      if (key.startsWith("$") || key.startsWith("_")) continue;
      if (typeof store[key] === "function" && !getterSet.has(key)) {
        actionNames.push(key);
      }
    }
  }
  if (actionNames.length > 0) {
    output.push("## Actions");
    for (const key of actionNames) {
      output.push(`  ${key}()`);
    }
    output.push("");
  }

  return output.join("\n");
}

export function formatRouterInfo(actualRouter: any): string {
  if (!actualRouter) return "Vue Router not found";

  const output: string[] = [];
  output.push("# Vue Router\n");

  const currentRoute = actualRouter.currentRoute?.value || actualRouter.currentRoute;
  if (currentRoute) {
    output.push("## Current Route");
    output.push(`  Path: ${currentRoute.path}`);
    output.push(`  Name: ${currentRoute.name || "(unnamed)"}`);
    if (currentRoute.params && Object.keys(currentRoute.params).length > 0) {
      output.push(`  Params: ${JSON.stringify(currentRoute.params)}`);
    }
    if (currentRoute.query && Object.keys(currentRoute.query).length > 0) {
      output.push(`  Query: ${JSON.stringify(currentRoute.query)}`);
    }
    if (currentRoute.hash) {
      output.push(`  Hash: ${currentRoute.hash}`);
    }
    if (currentRoute.meta && Object.keys(currentRoute.meta).length > 0) {
      output.push(`  Meta: ${JSON.stringify(currentRoute.meta)}`);
    }
    const matched = currentRoute.matched;
    if (Array.isArray(matched) && matched.length > 1) {
      output.push(`  Matched: ${matched.map((r: any) => r.path || r.name).join(" > ")}`);
    }
    output.push("");
  }

  const routes = actualRouter.getRoutes?.() || actualRouter.options?.routes || [];
  if (routes.length > 0) {
    output.push("## All Routes");
    routes.forEach((route: any) => {
      const routeName = route.name ? ` (${route.name})` : "";
      const meta = route.meta && Object.keys(route.meta).length > 0
        ? ` meta=${JSON.stringify(route.meta)}`
        : "";
      output.push(`  ${route.path}${routeName}${meta}`);
    });
  }

  return output.join("\n");
}

/**
 * Get Vue component tree from the page
 */
export async function getComponentTree(page: Page): Promise<string> {
  const result = await page.evaluate(() => {
    // Access Vue DevTools global hook
    const hook = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return "Vue DevTools not found";
    return hook.apps || [];
  });

  return formatComponentTree(result);
}

/**
 * Get component details by ID
 */
export async function getComponentDetails(page: Page, id: string): Promise<string> {
  const result = await page.evaluate((componentId) => {
    const hook = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return "Vue DevTools not found";

    const apps = hook.apps || [];
    let targetInstance: any = null;

    // Find component by uid
    const findComponent = (instance: any): any => {
      if (!instance) return null;
      if (String(instance.uid) === componentId) return instance;

      // Search in subTree
      const subTree = instance.subTree;
      if (subTree?.component) {
        const found = findComponent(subTree.component);
        if (found) return found;
      }
      if (subTree?.children) {
        for (const child of subTree.children) {
          if (child?.component) {
            const found = findComponent(child.component);
            if (found) return found;
          }
        }
      }

      // Search in children
      if (instance.children) {
        for (const child of instance.children) {
          const found = findComponent(child);
          if (found) return found;
        }
      }

      return null;
    };

    // Search all apps
    for (const app of apps) {
      const rootInstance = app._instance || app._container?._vnode?.component;
      targetInstance = findComponent(rootInstance);
      if (targetInstance) break;
    }
    return targetInstance;
  }, id);

  if (typeof result === "string") return result;
  return formatComponentDetails(result, id);
}

/**
 * Get Pinia stores
 */
export async function getPiniaStores(page: Page, storeName?: string): Promise<string> {
  const result = await page.evaluate((name) => {
    const hook = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
    const piniaFromApp = hook?.apps?.[0]?.config?.globalProperties?.$pinia;
    const pinia = (window as any).__PINIA__ || (window as any).pinia || piniaFromApp;
    return pinia || null;
  }, storeName);

  return formatPiniaStores(result, storeName);
}

/**
 * Get Vue Router information
 */
export async function getRouterInfo(page: Page): Promise<string> {
  const result = await page.evaluate(() => {
    const router = (window as any).$router || (window as any).__VUE_ROUTER__;
    const hook = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
    let routerFromApp = null;
    if (hook?.apps?.[0]) {
      const app = hook.apps[0];
      routerFromApp = app.config?.globalProperties?.$router;
    }
    return router || routerFromApp || null;
  });

  return formatRouterInfo(result);
}
