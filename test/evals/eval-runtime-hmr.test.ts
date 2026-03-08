import { afterEach, describe, expect, it } from "vitest";
import { runCli, startEvalDaemon, type EvalCmd } from "./harness";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

describe("eval: runtime and hmr", () => {
  it("reports runtime snapshot with key fields", async () => {
    const session = `eval-runtime-${process.pid}-${Date.now()}`;
    const daemon = await startEvalDaemon(session, (cmd: EvalCmd) => {
      if (cmd.action === "vite-runtime") {
        return {
          ok: true,
          data: [
            "# Vite Runtime",
            "URL: http://127.0.0.1:5173/",
            "Framework: vue",
            "Vite Client: loaded",
            "HMR Socket: open",
          ].join("\n"),
        };
      }
      return { ok: true, data: "ok" };
    });
    cleanups.push(daemon.cleanup);

    const res = await runCli(["vite", "runtime"], { VITE_BROWSER_SESSION: session });
    expect(res.code).toBe(0);
    expect(res.stdout).toContain("# Vite Runtime");
    expect(res.stdout).toContain("Framework: vue");
    expect(res.stdout).toContain("HMR Socket: open");
  });

  it("outputs hmr summary, trace, and clear states", async () => {
    const session = `eval-hmr-${process.pid}-${Date.now()}`;
    const daemon = await startEvalDaemon(session, (cmd: EvalCmd) => {
      if (cmd.action !== "vite-hmr") return { ok: true, data: "ok" };
      if (cmd.mode === "clear") return { ok: true, data: "cleared HMR trace" };
      if (cmd.mode === "trace") {
        return { ok: true, data: "# HMR Trace\n[12:00:00] update /src/App.vue" };
      }
      return {
        ok: true,
        data: "# HMR Summary\nEvents considered: 3\nCounts: update=2, connected=1",
      };
    });
    cleanups.push(daemon.cleanup);

    const summary = await runCli(["vite", "hmr"], { VITE_BROWSER_SESSION: session });
    expect(summary.code).toBe(0);
    expect(summary.stdout).toContain("# HMR Summary");

    const trace = await runCli(["vite", "hmr", "trace", "--limit", "5"], {
      VITE_BROWSER_SESSION: session,
    });
    expect(trace.code).toBe(0);
    expect(trace.stdout).toContain("# HMR Trace");
    expect(trace.stdout).toContain("/src/App.vue");

    const clear = await runCli(["vite", "hmr", "clear"], { VITE_BROWSER_SESSION: session });
    expect(clear.code).toBe(0);
    expect(clear.stdout).toContain("cleared HMR trace");
  });
});
