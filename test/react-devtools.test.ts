import { describe, expect, it } from "vitest";
import { format, path, type ReactNode } from "../src/react/devtools.js";

describe("react devtools helpers", () => {
  it("formats tree output with depth and key", () => {
    const nodes: ReactNode[] = [
      { id: 1, type: 11, name: null, key: null, parent: 0 },
      { id: 2, type: 0, name: "App", key: null, parent: 1 },
      { id: 3, type: 0, name: "Counter", key: "main", parent: 2 },
    ];

    const out = format(nodes);

    expect(out).toContain("# React component tree");
    expect(out).toContain("0 1 - Root");
    expect(out).toContain("1 2 1 App");
    expect(out).toContain('2 3 2 Counter key="main"');
  });

  it("builds ancestor path from snapshot", () => {
    const nodes: ReactNode[] = [
      { id: 10, type: 11, name: null, key: null, parent: 0 },
      { id: 11, type: 0, name: "App", key: null, parent: 10 },
      { id: 12, type: 0, name: "List", key: null, parent: 11 },
      { id: 13, type: 0, name: "Item", key: null, parent: 12 },
    ];

    expect(path(nodes, 13)).toBe("Root > App > List > Item");
  });
});