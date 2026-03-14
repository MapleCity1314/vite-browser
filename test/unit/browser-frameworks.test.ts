import { describe, expect, it } from "vitest";
import { detectFrameworkFromGlobals } from "../../src/browser-frameworks.js";

describe("browser framework detection", () => {
  it("does not classify pages as React based on the injected hook alone", () => {
    expect(
      detectFrameworkFromGlobals({
        vueVersion: null,
        hasVueHook: false,
        hasReactGlobal: false,
        hasReactRootMarker: false,
        reactRendererVersion: null,
        svelteVersion: null,
        hasSvelteHook: false,
      }),
    ).toBe("unknown");
  });

  it("classifies React when a renderer is actually attached", () => {
    expect(
      detectFrameworkFromGlobals({
        reactRendererVersion: "19.0.0",
      }),
    ).toBe("react@19.0.0");
  });

  it("classifies Vue when the mounted app marker exists", () => {
    expect(
      detectFrameworkFromGlobals({
        hasVueAppMarker: true,
      }),
    ).toBe("vue@unknown");
  });

  it("prefers Svelte over a bare injected React hook", () => {
    expect(
      detectFrameworkFromGlobals({
        reactRendererVersion: null,
        svelteVersion: "5.0.0",
      }),
    ).toBe("svelte@5.0.0");
  });
});
