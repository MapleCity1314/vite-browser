import { describe, expect, it, vi } from "vitest";
import { exit, normalizeUrl, parseNumberFlag, printUsage, runCli, type CliIo } from "../../src/cli.js";

function createIo() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const send = vi.fn(async (action: string) => ({ ok: true as const, data: action }));
  const io: CliIo = {
    send,
    readFile: vi.fn(() => '[{"name":"token","value":"abc"}]'),
    stdout: (text) => void stdout.push(text),
    stderr: (text) => void stderr.push(text),
    exit: ((code: number) => {
      throw new Error(`EXIT:${code}`);
    }) as never,
  };
  return { io, stdout, stderr, send };
}

async function expectExit(run: Promise<unknown>) {
  await expect(run).rejects.toThrow(/EXIT:/);
}

describe("cli core helpers", () => {
  it("normalizes url and numeric flags", () => {
    expect(normalizeUrl("127.0.0.1:5173")).toBe("http://127.0.0.1:5173");
    expect(normalizeUrl("https://example.com")).toBe("https://example.com");
    expect(parseNumberFlag(["--limit", "7"], "--limit", 20)).toBe(7);
    expect(parseNumberFlag([], "--limit", 20)).toBe(20);
  });

  it("prints usage text", () => {
    expect(printUsage()).toContain("vite-browser - Programmatic access");
    expect(printUsage()).toContain("vite module-graph trace");
    expect(printUsage()).toContain("correlate errors");
    expect(printUsage()).toContain("correlate renders");
    expect(printUsage()).toContain("diagnose propagation");
  });

  it("exits with error result", () => {
    const io = {
      stdout: vi.fn(),
      stderr: vi.fn(),
      exit: ((code: number) => {
        throw new Error(`EXIT:${code}`);
      }) as never,
    };
    expect(() => exit(io, { ok: false, error: "boom" }, "")).toThrow("EXIT:1");
    expect(io.stderr).toHaveBeenCalledWith("boom");
  });
});

describe("cli runner", () => {
  it("handles help and unknown command", async () => {
    const help = createIo();
    await expectExit(runCli(["node", "cli", "--help"], help.io));
    expect(help.stdout[0]).toContain("USAGE");

    const unknown = createIo();
    await expectExit(runCli(["node", "cli", "wat"], unknown.io));
    expect(unknown.stderr[0]).toContain("unknown command: wat");
  });

  it("handles open with cookies flow", async () => {
    const ctx = createIo();
    await expectExit(
      runCli(["node", "cli", "open", "127.0.0.1:5173", "--cookies-json", "cookies.json"], ctx.io),
    );

    expect(ctx.send).toHaveBeenNthCalledWith(1, "open");
    expect(ctx.send).toHaveBeenNthCalledWith(2, "cookies", {
      cookies: [{ name: "token", value: "abc" }],
      domain: "127.0.0.1",
    });
    expect(ctx.send).toHaveBeenNthCalledWith(3, "goto", { url: "http://127.0.0.1:5173" });
    expect(ctx.stdout[0]).toContain("opened -> http://127.0.0.1:5173");
  });

  it("routes vite and utility commands", async () => {
    const ctx = createIo();
    await expectExit(runCli(["node", "cli", "vite", "hmr", "trace", "--limit", "3"], ctx.io));
    expect(ctx.send).toHaveBeenLastCalledWith("vite-hmr", { mode: "trace", limit: 3 });

    const ctx2 = createIo();
    await expectExit(
      runCli(["node", "cli", "vite", "module-graph", "trace", "--filter", "/src/"], ctx2.io),
    );
    expect(ctx2.send).toHaveBeenLastCalledWith("vite-module-graph", {
      mode: "trace",
      filter: "/src/",
      limit: 200,
    });

    const ctx3 = createIo();
    await expectExit(runCli(["node", "cli", "errors", "--mapped", "--inline-source"], ctx3.io));
    expect(ctx3.send).toHaveBeenLastCalledWith("errors", { mapped: true, inlineSource: true });

    const ctx4 = createIo();
    await expectExit(
      runCli(["node", "cli", "correlate", "errors", "--mapped", "--window", "9000"], ctx4.io),
    );
    expect(ctx4.send).toHaveBeenLastCalledWith("correlate-errors", {
      mapped: true,
      inlineSource: false,
      windowMs: 9000,
    });

    const ctx5 = createIo();
    await expectExit(
      runCli(["node", "cli", "diagnose", "hmr", "--limit", "25", "--window", "7000"], ctx5.io),
    );
    expect(ctx5.send).toHaveBeenLastCalledWith("diagnose-hmr", {
      mapped: false,
      inlineSource: false,
      windowMs: 7000,
      limit: 25,
    });

    const ctx6 = createIo();
    await expectExit(runCli(["node", "cli", "correlate", "renders", "--window", "6000"], ctx6.io));
    expect(ctx6.send).toHaveBeenLastCalledWith("correlate-renders", {
      windowMs: 6000,
    });

    const ctx7 = createIo();
    await expectExit(runCli(["node", "cli", "diagnose", "propagation", "--window", "6000"], ctx7.io));
    expect(ctx7.send).toHaveBeenLastCalledWith("diagnose-propagation", {
      windowMs: 6000,
    });
  });

  it("validates required args", async () => {
    const gotoCtx = createIo();
    await expectExit(runCli(["node", "cli", "goto"], gotoCtx.io));
    expect(gotoCtx.stderr[0]).toContain("usage: vite-browser goto <url>");

    const evalCtx = createIo();
    await expectExit(runCli(["node", "cli", "eval"], evalCtx.io));
    expect(evalCtx.stderr[0]).toContain("usage: vite-browser eval <script>");
  });
});
