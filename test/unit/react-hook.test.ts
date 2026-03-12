import { describe, it, expect } from "vitest";
import {
  formatHookHealth,
  getHookSource,
  type HookHealthStatus,
} from "../../src/react/hook-manager.js";

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
});
