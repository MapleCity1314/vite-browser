import { describe, it, expect } from "vitest";
import {
  formatHookHealth,
  getHookSource,
  type HookHealthStatus,
} from "../../src/react/hook-manager.js";
import { decodeOperations } from "../../src/react/devtools.js";

describe("React DevTools Hook Manager", () => {
  it("loads hook source code", () => {
    const source = getHookSource();
    expect(source).toBeTruthy();
    expect(source).toContain("__REACT_DEVTOOLS_GLOBAL_HOOK__");
    expect(source).toContain("supportsFiber");
  });

  it("caches hook source on subsequent calls", () => {
    const source1 = getHookSource();
    const source2 = getHookSource();
    // Should return the exact same string reference (cached)
    expect(source1).toBe(source2);
  });

  it("formats healthy hook status", () => {
    const status: HookHealthStatus = {
      installed: true,
      hasRenderers: true,
      rendererCount: 1,
      hasFiberSupport: true,
    };

    const output = formatHookHealth(status);
    expect(output).toContain("# React DevTools Hook Status");
    expect(output).toContain("Installed: ✅ Yes");
    expect(output).toContain("Fiber support:");
    expect(output).toContain("Yes");
    expect(output).toContain("Renderers: 1");
    expect(output).toContain("Has renderers: ✅ Yes");
  });

  it("formats hook not installed status", () => {
    const status: HookHealthStatus = {
      installed: false,
      hasRenderers: false,
      rendererCount: 0,
      hasFiberSupport: false,
    };

    const output = formatHookHealth(status);
    expect(output).toContain("Installed: ❌ No");
    expect(output).toContain("Hook not installed");
    expect(output).toContain("React DevTools features will not work");
  });

  it("formats hook installed but no renderers", () => {
    const status: HookHealthStatus = {
      installed: true,
      hasRenderers: false,
      rendererCount: 0,
      hasFiberSupport: true,
    };

    const output = formatHookHealth(status);
    expect(output).toContain("Installed: ✅ Yes");
    expect(output).toContain("Has renderers: ❌ No");
    expect(output).toContain("No React renderers detected");
  });

  it("hook source is valid JavaScript (no syntax errors)", () => {
    const source = getHookSource();
    // Should not throw when parsed
    expect(() => new Function(source)).not.toThrow();
  });

  it("hook source contains IIFE wrapper", () => {
    const source = getHookSource();
    // Should be an IIFE that installs the hook
    expect(source).toContain("installReactDevToolsHook");
    expect(source).toContain("inject");
    expect(source).toContain("onCommitFiberRoot");
  });

  it("tracks fiber roots and emits operations for committed trees", () => {
    const source = getHookSource();
    const install = new Function("window", `${source}; return window.__REACT_DEVTOOLS_GLOBAL_HOOK__;`);
    const messages: unknown[] = [];
    const mockWindow = {
      postMessage(message: unknown) {
        messages.push(message);
      },
    };

    const hook = install(mockWindow) as {
      inject: (renderer: unknown) => number;
      onCommitFiberRoot: (id: number, root: unknown) => void;
      rendererInterfaces: Map<number, { flushInitialOperations: () => void }>;
    };

    const rendererId = hook.inject({ version: "19.0.0" });
    expect(rendererId).toBe(1);
    expect(hook.inject({ version: "19.1.0" })).toBe(2);

    const counterFiber = {
      type: { name: "Counter" },
      key: "main",
      memoizedProps: { count: 1 },
      memoizedState: null,
      child: null,
      sibling: null,
    };
    const appFiber = {
      type: { name: "App" },
      key: null,
      memoizedProps: {},
      memoizedState: null,
      child: counterFiber,
      sibling: null,
    };
    counterFiber.return = appFiber;
    appFiber.return = null;

    hook.onCommitFiberRoot(rendererId, { current: appFiber });
    hook.rendererInterfaces.get(rendererId)?.flushInitialOperations();

    const operations = (messages[0] as { payload?: { payload?: number[] } })?.payload?.payload;
    expect(Array.isArray(operations)).toBe(true);
    expect(decodeOperations(operations!)).toEqual([
      { id: 1, type: 11, name: null, key: null, parent: 0 },
      { id: 2, type: 0, name: "App", key: null, parent: 1 },
      { id: 3, type: 0, name: "Counter", key: "main", parent: 2 },
    ]);
  });
});
