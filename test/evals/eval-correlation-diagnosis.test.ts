import { afterEach, describe, expect, it } from "vitest";
import { runCli, startEvalDaemon, type EvalCmd } from "./harness";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

describe("eval: correlation and diagnosis", () => {
  it("renders correlated error output for recent HMR updates", async () => {
    const session = `eval-correlation-${process.pid}-${Date.now()}`;
    const daemon = await startEvalDaemon(session, (cmd: EvalCmd) => {
      if (cmd.action !== "correlate-errors") return { ok: true, data: "ok" };
      return {
        ok: true,
        data: [
          "# Error Correlation",
          "",
          "## Current Error",
          "TypeError: boom at /src/App.tsx:4:2",
          "",
          "## Correlation",
          "Confidence: high",
          "HMR update observed within 5000ms of the current error",
          "Matching modules: /src/App.tsx",
          "Recent events considered: 1",
          "",
          "## Related Events",
          "- hmr-update: /src/App.tsx",
        ].join("\n"),
      };
    });
    cleanups.push(daemon.cleanup);

    const res = await runCli(["correlate", "errors", "--mapped", "--window", "5000"], {
      VITE_BROWSER_SESSION: session,
    });

    expect(res.code).toBe(0);
    expect(res.stdout).toContain("# Error Correlation");
    expect(res.stdout).toContain("Confidence: high");
    expect(res.stdout).toContain("/src/App.tsx");
  });

  it("renders diagnosis output with multiple rule hits", async () => {
    const session = `eval-diagnose-${process.pid}-${Date.now()}`;
    const daemon = await startEvalDaemon(session, (cmd: EvalCmd) => {
      if (cmd.action !== "diagnose-hmr") return { ok: true, data: "ok" };
      return {
        ok: true,
        data: [
          "# HMR Diagnosis",
          "",
          "## missing-module",
          "Status: fail",
          "Confidence: high",
          "A module import failed to resolve during HMR.",
          "The current error overlaps with recent updates to /src/App.tsx.",
          "Suggestion: Verify the import path, file extension, alias configuration, and whether the module exists on disk.",
          "",
          "## repeated-full-reload",
          "Status: warn",
          "Confidence: medium",
          "Vite is repeatedly falling back to full page reloads.",
          "Observed 2 full-reload events in the recent HMR trace.",
          "Suggestion: Check whether the changed module is outside HMR boundaries, introduces side effects, or triggers a circular dependency.",
        ].join("\n"),
      };
    });
    cleanups.push(daemon.cleanup);

    const res = await runCli(["diagnose", "hmr", "--limit", "25", "--window", "7000"], {
      VITE_BROWSER_SESSION: session,
    });

    expect(res.code).toBe(0);
    expect(res.stdout).toContain("# HMR Diagnosis");
    expect(res.stdout).toContain("## missing-module");
    expect(res.stdout).toContain("Status: fail");
    expect(res.stdout).toContain("## repeated-full-reload");
  });

  it("renders websocket diagnosis from disconnect evidence without overclaiming unknown runtime state", async () => {
    const session = `eval-diagnose-ws-${process.pid}-${Date.now()}`;
    const daemon = await startEvalDaemon(session, (cmd: EvalCmd) => {
      if (cmd.action !== "diagnose-hmr") return { ok: true, data: "ok" };
      return {
        ok: true,
        data: [
          "# HMR Diagnosis",
          "",
          "## hmr-websocket-closed",
          "Status: fail",
          "Confidence: medium",
          "The HMR websocket is not healthy.",
          "HMR trace contains disconnect or websocket failure messages.",
          "Suggestion: Check the dev server is running, the page is connected to the correct origin, and no proxy/firewall is blocking the websocket.",
        ].join("\n"),
      };
    });
    cleanups.push(daemon.cleanup);

    const res = await runCli(["diagnose", "hmr", "--limit", "10"], {
      VITE_BROWSER_SESSION: session,
    });

    expect(res.code).toBe(0);
    expect(res.stdout).toContain("## hmr-websocket-closed");
    expect(res.stdout).toContain("Confidence: medium");
    expect(res.stdout).toContain("disconnect");
  });
});
