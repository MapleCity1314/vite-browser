import { describe, expect, it } from "vitest";
import { formatComponentDetails, formatComponentTree, type SvelteNode } from "../../src/svelte/devtools.js";

describe("svelte devtools helpers", () => {
  it("formats empty tree guidance", () => {
    const out = formatComponentTree([]);
    expect(out).toContain("Svelte app detected, but no DevTools component graph is available.");
  });

  it("formats component tree hierarchy", () => {
    const nodes: SvelteNode[] = [
      { id: 1, parent: 0, name: "App" },
      { id: 2, parent: 1, name: "Counter" },
      { id: 3, parent: 2, name: "Button" },
    ];

    const out = formatComponentTree(nodes);
    expect(out).toContain("[1] App");
    expect(out).toContain("[2] Counter");
    expect(out).toContain("[3] Button");
  });

  it("formats component details with props and source", () => {
    const nodes: SvelteNode[] = [
      { id: 2, parent: 1, name: "Counter", props: { count: 3 }, file: "/src/Counter.svelte" },
    ];

    const out = formatComponentDetails(nodes, "2");
    expect(out).toContain("# Name: Counter");
    expect(out).toContain("count: 3");
    expect(out).toContain("/src/Counter.svelte");
  });

  it("reports missing component ids", () => {
    expect(formatComponentDetails([], "9")).toContain("Component 9 not found");
  });
});
