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

/**
 * Get Vue component tree from the page
 */
export async function getComponentTree(page: Page): Promise<string> {
  const result = await page.evaluate(() => {
    // Access Vue DevTools global hook
    const hook = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) return "Vue DevTools not found";

    const apps = hook.apps || [];
    if (apps.length === 0) return "No Vue apps found";

    const output: string[] = [];
    output.push("# Vue Component Tree");
    output.push(`# ${apps.length} app(s) detected\n`);

    apps.forEach((app: any, appIndex: number) => {
      const appName = app._component?.name || app.config?.globalProperties?.$options?.name || `App ${appIndex}`;
      output.push(`## App: ${appName}`);

      // Get root instance
      const rootInstance = app._instance || app._container?._vnode?.component;
      if (!rootInstance) {
        output.push("  (no root instance)");
        return;
      }

      // Traverse component tree
      const traverse = (instance: any, depth: number = 0) => {
        if (!instance) return;

        const indent = "  ".repeat(depth);
        const name = instance.type?.name || instance.type?.__name || "Anonymous";
        const uid = instance.uid ?? "?";

        output.push(`${indent}[${uid}] ${name}`);

        // Traverse children
        const subTree = instance.subTree;
        if (subTree?.component) {
          traverse(subTree.component, depth + 1);
        }
        if (subTree?.children) {
          subTree.children.forEach((child: any) => {
            if (child?.component) {
              traverse(child.component, depth + 1);
            }
          });
        }

        // Traverse direct children
        if (instance.children) {
          instance.children.forEach((child: any) => {
            traverse(child, depth + 1);
          });
        }
      };

      traverse(rootInstance, 1);
      output.push("");
    });

    return output.join("\n");
  });

  return result;
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

    if (!targetInstance) return `Component ${componentId} not found`;

    const output: string[] = [];
    const name = targetInstance.type?.name || targetInstance.type?.__name || "Anonymous";

    output.push(`# Component: ${name}`);
    output.push(`# UID: ${targetInstance.uid}\n`);

    // Props
    if (targetInstance.props && Object.keys(targetInstance.props).length > 0) {
      output.push("## Props");
      for (const [key, value] of Object.entries(targetInstance.props)) {
        output.push(`  ${key}: ${JSON.stringify(value)}`);
      }
      output.push("");
    }

    // Data
    if (targetInstance.data && Object.keys(targetInstance.data).length > 0) {
      output.push("## Data");
      for (const [key, value] of Object.entries(targetInstance.data)) {
        output.push(`  ${key}: ${JSON.stringify(value)}`);
      }
      output.push("");
    }

    // Setup state (Composition API)
    const setupState = targetInstance.setupState || targetInstance.devtoolsRawSetupState;
    if (setupState && Object.keys(setupState).length > 0) {
      output.push("## Setup State");
      for (const [key, value] of Object.entries(setupState)) {
        if (typeof value === 'function') {
          output.push(`  ${key}: [Function]`);
        } else {
          output.push(`  ${key}: ${JSON.stringify(value)}`);
        }
      }
      output.push("");
    }

    // Computed
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

    // File location
    const file = targetInstance.type?.__file;
    if (file) {
      output.push(`## Source`);
      output.push(`  ${file}`);
    }

    return output.join("\n");
  }, id);

  return result;
}

/**
 * Get Pinia stores
 */
export async function getPiniaStores(page: Page, storeName?: string): Promise<string> {
  const result = await page.evaluate((name) => {
    // Try to find Pinia instance
    const pinia = (window as any).__PINIA__ || (window as any).pinia;
    if (!pinia) return "Pinia not found";

    const stores = pinia._s || pinia.state?.value || {};
    const storeKeys = Object.keys(stores);

    if (storeKeys.length === 0) return "No Pinia stores found";

    const output: string[] = [];

    if (!name) {
      // List all stores
      output.push("# Pinia Stores\n");
      storeKeys.forEach((key) => {
        output.push(`- ${key}`);
      });
      output.push("\nUse 'vite-browser vue pinia <store-name>' to inspect a specific store");
      return output.join("\n");
    }

    // Get specific store
    const store = stores[name];
    if (!store) return `Store '${name}' not found`;

    output.push(`# Pinia Store: ${name}\n`);

    // State
    const state = store.$state || store.state || store;
    if (state && typeof state === 'object') {
      output.push("## State");
      for (const [key, value] of Object.entries(state)) {
        if (key.startsWith('$')) continue; // Skip Pinia internals
        output.push(`  ${key}: ${JSON.stringify(value)}`);
      }
      output.push("");
    }

    // Getters
    const getters = store._getters || {};
    if (Object.keys(getters).length > 0) {
      output.push("## Getters");
      for (const key of Object.keys(getters)) {
        try {
          const value = store[key];
          output.push(`  ${key}: ${JSON.stringify(value)}`);
        } catch {
          output.push(`  ${key}: [Error]`);
        }
      }
      output.push("");
    }

    return output.join("\n");
  }, storeName);

  return result;
}

/**
 * Get Vue Router information
 */
export async function getRouterInfo(page: Page): Promise<string> {
  const result = await page.evaluate(() => {
    // Try to find Vue Router instance
    const router = (window as any).$router || (window as any).__VUE_ROUTER__;

    // Also try to get from Vue app
    const hook = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
    let routerFromApp = null;
    if (hook?.apps?.[0]) {
      const app = hook.apps[0];
      routerFromApp = app.config?.globalProperties?.$router;
    }

    const actualRouter = router || routerFromApp;
    if (!actualRouter) return "Vue Router not found";

    const output: string[] = [];
    output.push("# Vue Router\n");

    // Current route
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
      output.push("");
    }

    // All routes
    const routes = actualRouter.getRoutes?.() || actualRouter.options?.routes || [];
    if (routes.length > 0) {
      output.push("## All Routes");
      routes.forEach((route: any) => {
        const name = route.name ? ` (${route.name})` : "";
        output.push(`  ${route.path}${name}`);
      });
    }

    return output.join("\n");
  });

  return result;
}
