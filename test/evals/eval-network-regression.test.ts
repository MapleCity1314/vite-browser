import { afterEach, describe, expect, it } from "vitest";
import { runCli, startEvalDaemon, type EvalCmd } from "./harness";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

describe("eval: network regression triage", () => {
  it("lists network requests with failing status signal", async () => {
    const session = `eval-network-${process.pid}-${Date.now()}`;
    const daemon = await startEvalDaemon(session, (cmd: EvalCmd) => {
      if (cmd.action !== "network") return { ok: true, data: "ok" };
      if (typeof cmd.idx === "number") {
        return {
          ok: true,
          data: [
            "POST http://127.0.0.1:5173/api/users",
            "type: fetch  80ms",
            "",
            "response: 500 Internal Server Error",
            "response body:",
            '{"error":"db timeout"}',
          ].join("\n"),
        };
      }
      return {
        ok: true,
        data: [
          "# Network requests since last navigation",
          "# Columns: idx status method type ms url",
          "",
          "0 200 GET document 10ms http://127.0.0.1:5173/",
          "1 500 POST fetch 80ms http://127.0.0.1:5173/api/users",
        ].join("\n"),
      };
    });
    cleanups.push(daemon.cleanup);

    const list = await runCli(["network"], { VITE_BROWSER_SESSION: session });
    expect(list.code).toBe(0);
    expect(list.stdout).toContain("# Network requests since last navigation");
    expect(list.stdout).toContain("500 POST fetch");

    const detail = await runCli(["network", "1"], { VITE_BROWSER_SESSION: session });
    expect(detail.code).toBe(0);
    expect(detail.stdout).toContain("response: 500 Internal Server Error");
    expect(detail.stdout).toContain("db timeout");
  });
});
