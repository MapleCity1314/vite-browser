import type { RenderEventPayload, VBEvent } from "./event-queue.js";

export function initBrowserEventCollector(): void {
  if ((window as any).__vb_events) return;

  (window as any).__vb_events = [];
  (window as any).__vb_push = (event: VBEvent) => {
    const q = (window as any).__vb_events as VBEvent[];
    q.push(event);
    if (q.length > 1000) q.shift();
  };

  const inferFramework = (): RenderEventPayload["framework"] => {
    if ((window as any).__VUE__ || (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__) return "vue";
    if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ || (window as any).React) return "react";
    if ((window as any).__SVELTE__ || (window as any).__svelte || (window as any).__SVELTE_DEVTOOLS_GLOBAL_HOOK__) {
      return "svelte";
    }
    return "unknown";
  };

  const inferRenderLabel = () => {
    const heading =
      document.querySelector("main h1, [role='main'] h1, h1")?.textContent?.trim() ||
      document.title ||
      location.pathname ||
      "/";
    return heading.slice(0, 120);
  };

  const inferVueRenderDetails = () => {
    const hook = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
    const apps = hook?.apps;
    if (!Array.isArray(apps) || apps.length === 0) return null;

    const app = apps[0];
    const rootInstance = app?._instance || app?._container?._vnode?.component;
    if (!rootInstance) return null;

    const names: string[] = [];
    let current = rootInstance;
    let guard = 0;
    while (current && guard < 8) {
      const name =
        current.type?.name ||
        current.type?.__name ||
        current.type?.__file?.split(/[\\/]/).pop()?.replace(/\.\w+$/, "") ||
        "Anonymous";
      names.push(String(name));
      const nextFromSubtree = current.subTree?.component;
      const nextFromChildren = Array.isArray(current.subTree?.children)
        ? current.subTree.children.find((child: any) => child?.component)?.component
        : null;
      current = nextFromSubtree || nextFromChildren || null;
      guard++;
    }

    const pinia = (window as any).__PINIA__ || (window as any).pinia || app?.config?.globalProperties?.$pinia;
    const registry = pinia?._s;
    const storeIds = registry instanceof Map
      ? Array.from(registry.keys()).map(String)
      : registry && typeof registry === "object"
        ? Object.keys(registry)
        : [];

    return {
      component: names[names.length - 1] || inferRenderLabel(),
      componentPath: names.join(" > "),
      storeHints: storeIds.slice(0, 5),
    };
  };

  const inferRenderDetails = () => {
    const framework = inferFramework();
    if (framework === "vue") {
      const vue = inferVueRenderDetails();
      if (vue) {
        return {
          framework,
          component: vue.component,
          path: vue.componentPath,
          storeHints: vue.storeHints,
        };
      }
    }

    return {
      framework,
      component: inferRenderLabel(),
      path: `${framework}:${location.pathname || "/"}`,
      storeHints: [] as string[],
    };
  };

  const renderState =
    (window as any).__vb_render_state ||
    ((window as any).__vb_render_state = {
      timer: null as number | null,
      lastReason: "initial-load",
      mutationCount: 0,
    });

  const scheduleRender = (reason: string, extra: Record<string, unknown> = {}) => {
    renderState.lastReason = reason;
    renderState.mutationCount += Number(extra.mutationCount ?? 0);
    if (renderState.timer != null) window.clearTimeout(renderState.timer);
    renderState.timer = window.setTimeout(() => {
      const details = inferRenderDetails();
      const changedKeys = Array.isArray(extra.changedKeys)
        ? extra.changedKeys.filter((value): value is string => typeof value === "string" && value.length > 0)
        : [];
      (window as any).__vb_push({
        timestamp: Date.now(),
        type: "render",
        payload: {
          component: details.component,
          path: details.path,
          framework: details.framework,
          reason: renderState.lastReason,
          mutationCount: renderState.mutationCount,
          storeHints: details.storeHints,
          changedKeys,
        },
      } satisfies VBEvent);
      renderState.timer = null;
      renderState.mutationCount = 0;
    }, 60);
  };

  const attachPiniaSubscriptions = () => {
    if ((window as any).__vb_pinia_attached) return;
    const hook = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__;
    const app = Array.isArray(hook?.apps) ? hook.apps[0] : null;
    const pinia = (window as any).__PINIA__ || (window as any).pinia || app?.config?.globalProperties?.$pinia;
    const registry = pinia?._s;
    if (!(registry instanceof Map) || registry.size === 0) return;

    const attached = ((window as any).__vb_pinia_attached = new Set<string>());

    registry.forEach((store: any, storeId: string) => {
      if (!store || typeof store.$subscribe !== "function" || attached.has(String(storeId))) return;
      attached.add(String(storeId));
      const extractChangedKeys = (mutation: any) => {
        const keys = new Set<string>();
        const events = mutation?.events;
        const collect = (entry: any) => {
          const key = entry?.key ?? entry?.path;
          if (typeof key === "string" && key.length > 0) keys.add(key.split(".")[0]);
        };
        if (Array.isArray(events)) events.forEach(collect);
        else if (events && typeof events === "object") collect(events);

        const payload = mutation?.payload;
        if (payload && typeof payload === "object" && !Array.isArray(payload)) {
          Object.keys(payload).forEach((key) => keys.add(key));
        }

        return Array.from(keys).slice(0, 10);
      };

      store.$subscribe(
        (mutation: any) => {
          const changedKeys = extractChangedKeys(mutation);
          (window as any).__vb_push({
            timestamp: Date.now(),
            type: "store-update",
            payload: {
              store: String(storeId),
              mutationType: typeof mutation?.type === "string" ? mutation.type : "unknown",
              events: Array.isArray(mutation?.events) ? mutation.events.length : 0,
              changedKeys,
            },
          } satisfies VBEvent);
          scheduleRender("store-update", { changedKeys });
        },
        { detached: true } as any,
      );
    });
  };

  function attachViteListener(): boolean {
    const hot = (window as any).__vite_hot;
    if (hot?.ws) {
      hot.ws.addEventListener("message", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          (window as any).__vb_push({
            timestamp: Date.now(),
            type: data.type === "error" ? "hmr-error" : "hmr-update",
            payload: data,
          } satisfies VBEvent);
          if (data.type === "update" || data.type === "full-reload") {
            scheduleRender("hmr-message");
          }
        } catch {}
      });
      return true;
    }
    return false;
  }

  if (!attachViteListener()) {
    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      if (attachViteListener() || attempts >= 50) {
        clearInterval(timer);
      }
    }, 100);
  }

  const origOnError = window.onerror;
  window.onerror = (msg, src, line, col, err) => {
    (window as any).__vb_push({
      timestamp: Date.now(),
      type: "error",
      payload: { message: String(msg), source: src, line, col, stack: err?.stack },
    } satisfies VBEvent);
    return origOnError ? origOnError(msg, src, line, col, err) : false;
  };

  window.addEventListener("unhandledrejection", (e) => {
    (window as any).__vb_push({
      timestamp: Date.now(),
      type: "error",
      payload: { message: e.reason?.message, stack: e.reason?.stack },
    } satisfies VBEvent);
  });

  const observeDom = () => {
    const root = document.body || document.documentElement;
    if (!root || (window as any).__vb_render_observer) return;
    const observer = new MutationObserver((mutations) => {
      scheduleRender("dom-mutation", { mutationCount: mutations.length });
    });
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
    (window as any).__vb_render_observer = observer;
  };

  const patchHistory = () => {
    if ((window as any).__vb_history_patched) return;
    const wrap = (method: "pushState" | "replaceState") => {
      const original = history[method];
      const wrapped = ((...args: Parameters<History[typeof method]>) => {
        const result = Reflect.apply(original, history, args);
        scheduleRender(`history-${method}`);
        return result;
      }) as History[typeof method];
      history[method] = wrapped;
    };
    wrap("pushState");
    wrap("replaceState");
    window.addEventListener("popstate", () => scheduleRender("history-popstate"));
    window.addEventListener("hashchange", () => scheduleRender("hashchange"));
    (window as any).__vb_history_patched = true;
  };

  observeDom();
  patchHistory();
  attachPiniaSubscriptions();
  window.setInterval(attachPiniaSubscriptions, 1000);
  scheduleRender("initial-load");
}

export function readBrowserEvents(): VBEvent[] {
  const events = ((window as any).__vb_events ?? []) as VBEvent[];
  (window as any).__vb_events = [];
  return events;
}
