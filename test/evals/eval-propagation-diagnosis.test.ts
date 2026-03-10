import { afterEach, describe, expect, it } from "vitest";
import { runCli, startEvalDaemon, type EvalCmd } from "./harness";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) cleanups.pop()?.();
});

describe("eval: propagation diagnosis", () => {
  it("renders store -> render -> error propagation guidance", async () => {
    const session = `eval-propagation-store-${process.pid}-${Date.now()}`;
    const daemon = await startEvalDaemon(session, (cmd: EvalCmd) => {
      if (cmd.action === "correlate-renders") {
        return {
          ok: true,
          data: [
            "# Render Correlation",
            "",
            "Confidence: high",
            "Recent source/store updates likely propagated through 1 render step(s).",
            "",
            "## Source Updates",
            "- /src/stores/main.ts",
            "",
            "## Store Updates",
            "- main",
            "",
            "## Changed Keys",
            "- filters",
            "- sort",
            "",
            "## Render Path",
            "- AppShell > Dashboard > FundTable",
            "",
            "## Store Hints",
            "- main",
            "",
            "## Errors",
            "- TypeError: Cannot read properties of undefined (reading 'length')",
          ].join("\n"),
        };
      }

      if (cmd.action === "diagnose-propagation") {
        return {
          ok: true,
          data: [
            "# Propagation Diagnosis",
            "",
            "Status: fail",
            "Confidence: high",
            "A plausible store -> render -> error propagation path was found.",
            "Start with store main, then inspect AppShell > Dashboard > FundTable as the nearest affected component. Changed keys: filters, sort.",
            "Suggestion: Verify the recent store mutation first, then check whether the affected component or a dependent effect turns that state change into the visible failure.",
          ].join("\n"),
        };
      }

      return { ok: true, data: "ok" };
    });
    cleanups.push(daemon.cleanup);

    const correlation = await runCli(["correlate", "renders", "--window", "5000"], {
      VITE_BROWSER_SESSION: session,
    });
    expect(correlation.code).toBe(0);
    expect(correlation.stdout).toContain("# Render Correlation");
    expect(correlation.stdout).toContain("## Store Updates");
    expect(correlation.stdout).toContain("## Changed Keys");
    expect(correlation.stdout).toContain("FundTable");

    const diagnosis = await runCli(["diagnose", "propagation", "--window", "5000"], {
      VITE_BROWSER_SESSION: session,
    });
    expect(diagnosis.code).toBe(0);
    expect(diagnosis.stdout).toContain("# Propagation Diagnosis");
    expect(diagnosis.stdout).toContain("store -> render -> error");
    expect(diagnosis.stdout).toContain("Changed keys: filters, sort.");
  });

  it("renders propagation output for repeated network work around rerenders", async () => {
    const session = `eval-propagation-network-${process.pid}-${Date.now()}`;
    const daemon = await startEvalDaemon(session, (cmd: EvalCmd) => {
      if (cmd.action === "correlate-renders") {
        return {
          ok: true,
          data: [
            "# Render Correlation",
            "",
            "Confidence: medium",
            "Render activity observed near the current failure.",
            "",
            "## Source Updates",
            "(none)",
            "",
            "## Render Path",
            "- AppShell > SearchPage > ResultsPanel",
            "",
            "## Network Activity",
            "- /api/search?q=tech",
            "- /api/search?q=tech&page=2",
          ].join("\n"),
        };
      }

      if (cmd.action === "diagnose-propagation") {
        return {
          ok: true,
          data: [
            "# Propagation Diagnosis",
            "",
            "Status: warn",
            "Confidence: medium",
            "Render activity overlaps with repeated network work.",
            "Observed render activity around 2 network request target(s).",
            "Suggestion: Check whether rerenders are retriggering data fetches or invalidating derived state more often than expected.",
          ].join("\n"),
        };
      }

      return { ok: true, data: "ok" };
    });
    cleanups.push(daemon.cleanup);

    const correlation = await runCli(["correlate", "renders"], {
      VITE_BROWSER_SESSION: session,
    });
    expect(correlation.code).toBe(0);
    expect(correlation.stdout).toContain("## Network Activity");
    expect(correlation.stdout).toContain("/api/search?q=tech");

    const diagnosis = await runCli(["diagnose", "propagation"], {
      VITE_BROWSER_SESSION: session,
    });
    expect(diagnosis.code).toBe(0);
    expect(diagnosis.stdout).toContain("Render activity overlaps with repeated network work.");
    expect(diagnosis.stdout).toContain("Status: warn");
  });

  it("renders the demo-gif store -> render -> error output shape", async () => {
    const session = `eval-propagation-demo-gif-${process.pid}-${Date.now()}`;
    const daemon = await startEvalDaemon(session, (cmd: EvalCmd) => {
      if (cmd.action === "correlate-renders") {
        return {
          ok: true,
          data: [
            "# Render Correlation",
            "",
            "Confidence: high",
            "Recent source/store updates likely propagated through 1 render step(s).",
            "",
            "## Source Updates",
            "- /src/stores/cart.ts",
            "",
            "## Store Updates",
            "- cart",
            "",
            "## Changed Keys",
            "- items",
            "",
            "## Render Path",
            "- App > ShoppingCart > CartSummary",
            "",
            "## Store Hints",
            "- cart",
            "",
            "## Errors",
            "- Cannot read properties of undefined (reading 'reduce')",
          ].join("\n"),
        };
      }

      if (cmd.action === "diagnose-propagation") {
        return {
          ok: true,
          data: [
            "# Propagation Diagnosis",
            "",
            "Status: fail",
            "Confidence: high",
            "A plausible store -> render -> error propagation path was found.",
            "Start with store cart, then inspect App > ShoppingCart > CartSummary as the nearest affected component. Changed keys: items.",
            "Suggestion: Verify the recent store mutation first, then check whether the affected component or a dependent effect turns that state change into the visible failure.",
          ].join("\n"),
        };
      }

      return { ok: true, data: "ok" };
    });
    cleanups.push(daemon.cleanup);

    const correlation = await runCli(["correlate", "renders", "--window", "5000"], {
      VITE_BROWSER_SESSION: session,
    });
    expect(correlation.code).toBe(0);
    expect(correlation.stdout).toContain("/src/stores/cart.ts");
    expect(correlation.stdout).toContain("cart");
    expect(correlation.stdout).toContain("items");
    expect(correlation.stdout).toContain("App > ShoppingCart > CartSummary");

    const diagnosis = await runCli(["diagnose", "propagation", "--window", "5000"], {
      VITE_BROWSER_SESSION: session,
    });
    expect(diagnosis.code).toBe(0);
    expect(diagnosis.stdout).toContain("Status: fail");
    expect(diagnosis.stdout).toContain("store -> render -> error");
    expect(diagnosis.stdout).toContain("Changed keys: items.");
  });

  it("keeps propagation diagnosis conservative when evidence is incomplete", async () => {
    const session = `eval-propagation-inconclusive-${process.pid}-${Date.now()}`;
    const daemon = await startEvalDaemon(session, (cmd: EvalCmd) => {
      if (cmd.action === "correlate-renders") {
        return {
          ok: true,
          data: [
            "# Render Correlation",
            "",
            "Confidence: low",
            "Render activity observed.",
            "",
            "## Source Updates",
            "(none)",
            "",
            "## Render Path",
            "- AppShell > Dashboard",
          ].join("\n"),
        };
      }

      if (cmd.action === "diagnose-propagation") {
        return {
          ok: true,
          data: [
            "# Propagation Diagnosis",
            "",
            "Status: pass",
            "Confidence: low",
            "Propagation data is present but not yet conclusive.",
            "The current trace shows render activity, but not enough linked source/error evidence for a stronger diagnosis.",
            "Suggestion: Use the render correlation output to narrow the likely component path, then inspect source updates and runtime errors together.",
          ].join("\n"),
        };
      }

      return { ok: true, data: "ok" };
    });
    cleanups.push(daemon.cleanup);

    const diagnosis = await runCli(["diagnose", "propagation", "--window", "5000"], {
      VITE_BROWSER_SESSION: session,
    });

    expect(diagnosis.code).toBe(0);
    expect(diagnosis.stdout).toContain("# Propagation Diagnosis");
    expect(diagnosis.stdout).toContain("Status: pass");
    expect(diagnosis.stdout).toContain("not yet conclusive");
  });

  it("keeps no-trace propagation output explicit and low-confidence", async () => {
    const session = `eval-propagation-empty-${process.pid}-${Date.now()}`;
    const daemon = await startEvalDaemon(session, (cmd: EvalCmd) => {
      if (cmd.action === "diagnose-propagation") {
        return {
          ok: true,
          data: [
            "# Propagation Diagnosis",
            "",
            "Status: warn",
            "Confidence: low",
            "No propagation trace is available yet.",
            "The current event window does not contain render/update events, so propagation reasoning cannot start.",
            "Suggestion: Reproduce the issue once, then rerun `vite-browser correlate renders` or `vite-browser diagnose propagation`.",
          ].join("\n"),
        };
      }

      return { ok: true, data: "ok" };
    });
    cleanups.push(daemon.cleanup);

    const diagnosis = await runCli(["diagnose", "propagation"], {
      VITE_BROWSER_SESSION: session,
    });

    expect(diagnosis.code).toBe(0);
    expect(diagnosis.stdout).toContain("Status: warn");
    expect(diagnosis.stdout).toContain("No propagation trace is available yet.");
  });
});
