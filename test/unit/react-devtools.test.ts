import { describe, expect, it } from "vitest";
import {
  decodeOperations,
  format,
  formatHookLine,
  formatInspectionResult,
  path,
  previewValue,
  rectCount,
  skipOperation,
  suspenseSkip,
  type ReactNode,
} from "../../src/react/devtools.js";

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

  it("decodes react devtools operations into nodes", () => {
    const ops = [
      0,
      0,
      10,
      4, 82, 111, 111, 116,
      3, 65, 112, 112,
      4, 109, 97, 105, 110,
      1, 1, 11, 0, 0, 0, 0,
      1, 2, 0, 1, 0, 2, 3,
    ];

    expect(decodeOperations(ops)).toEqual([
      { id: 1, type: 11, name: null, key: null, parent: 0 },
      { id: 2, type: 0, name: "App", key: "main", parent: 1 },
    ]);
  });

  it("formats inspection payloads and previews values", () => {
    const out = formatInspectionResult("Counter", 7, {
      key: "main",
      props: { data: { count: 1 } },
      hooks: [{ id: 0, name: "State", value: 1, subHooks: [{}] }],
      state: { data: { ready: true } },
      context: { theme: "dark" },
      owners: [{ displayName: "App" }, { displayName: "Shell" }],
      source: [0, "/src/Counter.tsx", 10, 2],
    });

    expect(out.text).toContain("Counter #7");
    expect(out.text).toContain('key: "main"');
    expect(out.text).toContain("props:");
    expect(out.text).toContain("[0] State: 1 (1 sub)");
    expect(out.text).toContain("rendered by: App > Shell");
    expect(out.source).toEqual(["/src/Counter.tsx", 10, 2]);

    expect(previewValue({ preview_short: "short" })).toBe("short");
    expect(previewValue({ type: "undefined" })).toBe("undefined");
    expect(formatHookLine({ id: null, name: "Memo", value: [1, 2] })).toBe('Memo: [1, 2]');
  });

  it("computes skip sizes for operation payloads", () => {
    expect(rectCount(-1)).toBe(0);
    expect(rectCount(2)).toBe(8);
    expect(skipOperation(4, [4, 0, 0], 0)).toBe(3);
    expect(skipOperation(8, [8, 0, 0, 0, 0, 2], 0)).toBe(14);
    expect(suspenseSkip([12, 1, 0, 0, 0, 0, 0], 0)).toBe(7);
  });
});
