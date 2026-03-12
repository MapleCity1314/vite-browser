import { describe, expect, it } from "vitest";
import { resolveSocketDir, sanitizeSession } from "../../src/paths.js";
import { platformChromiumArgs } from "../../src/browser-session.js";

describe("paths", () => {
  describe("resolveSocketDir", () => {
    it("returns a directory path that contains 'vite-browser'", () => {
      const dir = resolveSocketDir();
      expect(dir).toContain("vite-browser");
    });

    it("returns a string ending with .vite-browser", () => {
      const dir = resolveSocketDir();
      expect(dir).toMatch(/\.vite-browser$|vite-browser-\d+$/);
    });
  });

  describe("sanitizeSession", () => {
    it("keeps alphanumeric, dash, and underscore", () => {
      expect(sanitizeSession("my-session_1")).toBe("my-session_1");
    });

    it("replaces dots and slashes", () => {
      expect(sanitizeSession("a.b/c\\d")).toBe("a_b_c_d");
    });

    it("replaces spaces and special characters", () => {
      expect(sanitizeSession("session name!@#")).toBe("session_name___");
    });

    it("handles empty string", () => {
      expect(sanitizeSession("")).toBe("");
    });
  });
});

describe("platformChromiumArgs", () => {
  it("always includes --auto-open-devtools-for-tabs", () => {
    const args = platformChromiumArgs();
    expect(args).toContain("--auto-open-devtools-for-tabs");
  });

  it("includes extra args when provided", () => {
    const args = platformChromiumArgs(["--custom-flag"]);
    expect(args).toContain("--custom-flag");
    expect(args).toContain("--auto-open-devtools-for-tabs");
  });

  it("returns an array of strings", () => {
    const args = platformChromiumArgs();
    expect(Array.isArray(args)).toBe(true);
    for (const arg of args) {
      expect(typeof arg).toBe("string");
    }
  });
});
