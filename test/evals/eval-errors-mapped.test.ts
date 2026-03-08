import { afterEach, describe, expect, it } from "vitest";
import { runCli, startEvalDaemon, type EvalCmd } from "./harness";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

describe("eval: mapped errors", () => {
  it("returns mapped stack for --mapped", async () => {
    const session = `eval-errors-${process.pid}-${Date.now()}`;
    const daemon = await startEvalDaemon(session, (cmd: EvalCmd) => {
      if (cmd.action !== "errors") return { ok: true, data: "ok" };
      return {
        ok: true,
        data: "TypeError: boom\n\n# Mapped Stack\n- http://127.0.0.1:5173/src/main.ts:20:5 -> src/main.ts:10:3",
      };
    });
    cleanups.push(daemon.cleanup);

    const res = await runCli(["errors", "--mapped"], { VITE_BROWSER_SESSION: session });
    expect(res.code).toBe(0);
    expect(res.stdout).toContain("# Mapped Stack");
    expect(res.stdout).toContain("src/main.ts:10:3");
  });

  it("includes source snippet for --mapped --inline-source", async () => {
    const session = `eval-errors-inline-${process.pid}-${Date.now()}`;
    const daemon = await startEvalDaemon(session, (cmd: EvalCmd) => {
      if (cmd.action !== "errors") return { ok: true, data: "ok" };
      if (cmd.inlineSource) {
        return {
          ok: true,
          data: [
            "TypeError: boom",
            "",
            "# Mapped Stack",
            "- http://127.0.0.1:5173/src/main.ts:20:5 -> src/main.ts:10:3",
            "  10 | const x = undefined;",
          ].join("\n"),
        };
      }
      return { ok: true, data: "TypeError: boom" };
    });
    cleanups.push(daemon.cleanup);

    const res = await runCli(["errors", "--mapped", "--inline-source"], {
      VITE_BROWSER_SESSION: session,
    });
    expect(res.code).toBe(0);
    expect(res.stdout).toContain("# Mapped Stack");
    expect(res.stdout).toContain("10 | const x = undefined;");
  });
});
