import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildMapCandidates,
  cleanSource,
  clearSourceMapCache,
  resolveViaSourceMap,
} from "../src/sourcemap.js";

describe("sourcemap helpers", () => {
  beforeEach(() => {
    clearSourceMapCache();
  });

  it("builds map candidates with query-first strategy", () => {
    const out = buildMapCandidates("http://localhost:5173", "http://localhost:5173/src/main.ts?t=1");
    expect(out).toEqual([
      "http://localhost:5173/src/main.ts.map?t=1",
      "http://localhost:5173/src/main.ts.map",
    ]);
  });

  it("cleans source paths and node_modules prefix", () => {
    expect(cleanSource("file:///C:/repo/node_modules/pkg/index.js")).toBe("node_modules/pkg/index.js");
    expect(cleanSource("/src/App.vue")).toBe("/src/App.vue");
  });

  it("resolves mapped position and snippet with cache reuse", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        version: 3,
        file: "/src/main.ts",
        names: [],
        sources: ["/src/main.ts"],
        sourcesContent: ["line1\nline2\nline3"],
        mappings: "AAAA;AACA;AACA",
      }),
    }));

    const one = await resolveViaSourceMap(
      "http://localhost:5173",
      "http://localhost:5173/src/main.ts?t=1",
      2,
      1,
      true,
      fetchMock as never,
    );
    const two = await resolveViaSourceMap(
      "http://localhost:5173",
      "http://localhost:5173/src/main.ts?t=1",
      2,
      1,
      false,
      fetchMock as never,
    );

    expect(one).toMatchObject({
      file: "/src/main.ts",
      line: 2,
      column: 1,
      snippet: "2 | line2",
    });
    expect(two).toMatchObject({ file: "/src/main.ts", line: 2, column: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to second map candidate when first is missing", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: 3,
          file: "/src/main.ts",
          names: [],
          sources: ["/src/main.ts"],
          sourcesContent: ["ok"],
          mappings: "AAAA",
        }),
      });

    const mapped = await resolveViaSourceMap(
      "http://localhost:5173",
      "http://localhost:5173/src/main.ts?t=2",
      1,
      1,
      false,
      fetchMock as never,
    );

    expect(mapped).toMatchObject({ file: "/src/main.ts", line: 1, column: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain(".map?t=2");
    expect(fetchMock.mock.calls[1][0]).toContain(".map");
  });
});
