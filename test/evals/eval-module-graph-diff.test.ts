import { afterEach, describe, expect, it } from "vitest";
import { runCli, startEvalDaemon, type EvalCmd } from "./harness";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

describe("eval: module graph diff", () => {
  it("supports snapshot, trace, and clear flows", async () => {
    const session = `eval-graph-${process.pid}-${Date.now()}`;
    const daemon = await startEvalDaemon(session, (cmd: EvalCmd) => {
      if (cmd.action !== "vite-module-graph") return { ok: true, data: "ok" };
      if (cmd.mode === "clear") return { ok: true, data: "cleared module-graph baseline" };
      if (cmd.mode === "trace") {
        return {
          ok: true,
          data: "# Vite Module Graph Trace\nAdded: 1, Removed: 0\n\n## Added\n+ http://127.0.0.1:5173/src/New.vue",
        };
      }
      return {
        ok: true,
        data: "# Vite Module Graph (loaded resources)\nTotal: 2\n# idx initiator ms url",
      };
    });
    cleanups.push(daemon.cleanup);

    const snapshot = await runCli(["vite", "module-graph", "--filter", "/src/", "--limit", "10"], {
      VITE_BROWSER_SESSION: session,
    });
    expect(snapshot.code).toBe(0);
    expect(snapshot.stdout).toContain("# Vite Module Graph");

    const trace = await runCli(["vite", "module-graph", "trace", "--limit", "10"], {
      VITE_BROWSER_SESSION: session,
    });
    expect(trace.code).toBe(0);
    expect(trace.stdout).toContain("# Vite Module Graph Trace");
    expect(trace.stdout).toContain("Added: 1, Removed: 0");

    const clear = await runCli(["vite", "module-graph", "clear"], {
      VITE_BROWSER_SESSION: session,
    });
    expect(clear.code).toBe(0);
    expect(clear.stdout).toContain("cleared module-graph baseline");
  });
});
