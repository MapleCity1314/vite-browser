import { readFileSync, writeFileSync } from "node:fs";
import { connect } from "node:net";
import { resolve } from "node:path";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const demoDir = resolve(process.cwd(), "../demo");
const cliPath = resolve(process.cwd(), "dist/cli.js");
const pnpmCjs = "C:\\Users\\murde\\AppData\\Roaming\\npm\\node_modules\\pnpm\\bin\\pnpm.cjs";
const npxCmd = "C:\\Program Files\\nodejs\\npx.cmd";
const mainTs = resolve(demoDir, "src/main.ts");
const baseUrl = "http://127.0.0.1:5173";

let demoProc: ChildProcess | null = null;
let demoLogs = "";

describe.sequential("evals-e2e: vite runtime tools", () => {
  beforeAll(async () => {
    await stopPortOwner(5173);
    const command = [
      `"${npxCmd}"`,
      "-y",
      "node@22.12.0",
      `"${pnpmCjs}"`,
      "dev",
      "--host",
      "127.0.0.1",
      "--port",
      "5173",
      "--strictPort",
    ].join(" ");
    demoProc = spawn(command, { cwd: demoDir, stdio: ["ignore", "pipe", "pipe"], shell: true });
    demoProc.stdout?.on("data", (d) => (demoLogs += d.toString()));
    demoProc.stderr?.on("data", (d) => (demoLogs += d.toString()));
    await waitForPort(5173, 60_000);
    await runCli(["close"], true);
  });

  afterAll(async () => {
    await runCli(["close"], true);
    if (demoProc?.pid) {
      spawnSync("cmd.exe", ["/c", `taskkill /PID ${demoProc.pid} /T /F`], { stdio: "ignore" });
    }
    await stopPortOwner(5173);
  });

  it("covers runtime/hmr/module-graph commands", async () => {
    await runCli(["open", baseUrl]);

    const runtime = await runCli(["vite", "runtime"]);
    expect(runtime).toContain("# Vite Runtime");
    expect(runtime).toContain("Framework: vue");

    const hmrSummary = await runCli(["vite", "hmr"]);
    expect(hmrSummary).toContain("# HMR");

    const hmrClear = await runCli(["vite", "hmr", "clear"]);
    expect(hmrClear).toContain("cleared HMR trace");

    const graphSnapshot = await runCli(["vite", "module-graph", "--limit", "10"]);
    expect(graphSnapshot).toContain("# Vite Module Graph");

    const graphTrace = await runCli(["vite", "module-graph", "trace", "--limit", "10"]);
    expect(graphTrace).toContain("# Vite Module Graph Trace");

    const graphClear = await runCli(["vite", "module-graph", "clear"]);
    expect(graphClear).toContain("cleared module-graph baseline");

    const correlation = await runCli(["correlate", "errors", "--mapped", "--window", "5000"], true);
    expect(correlation).toContain("# Error Correlation");

    const diagnosis = await runCli(["diagnose", "hmr", "--limit", "20"], true);
    expect(diagnosis).toContain("# HMR Diagnosis");
  });

  it("covers mapped errors flow with temporary compile error", async () => {
    const original = readFileSync(mainTs, "utf-8");
    try {
      writeFileSync(mainTs, `${original}\nimport './__vite_browser_tmp_missing__'\n`, "utf-8");
      await runCli(["reload"]);
      await sleep(1500);

      const mapped = await runCli(["errors", "--mapped"]);
      expect(mapped).toContain("Failed to resolve import");

      const mappedInline = await runCli(["errors", "--mapped", "--inline-source"]);
      expect(mappedInline).toContain("Failed to resolve import");
    } finally {
      writeFileSync(mainTs, original, "utf-8");
      await runCli(["reload"], true);
      await sleep(1000);
      const noErrors = await runCli(["errors"]);
      expect(noErrors).toContain("no errors");
    }
  });

  it("covers propagation commands with a real Pinia store update", async () => {
    await runCli(["open", baseUrl]);

    const update = await runCli([
      "eval",
      "(() => { const store = window.__PINIA__?._s?.get('cart'); if (!store) return { ok: false }; store.addToCart(store.products[0]); return { ok: true, totalItems: store.totalItems, totalPrice: store.totalPrice }; })()",
    ]);
    expect(update).toContain('"ok": true');

    await sleep(500);

    const correlation = await runCli(["correlate", "renders", "--window", "5000"], true);
    expect(correlation).toContain("# Render Correlation");
    expect(correlation).toContain("## Store Updates");
    expect(correlation).toContain("cart");
    expect(correlation).toContain("## Render Path");

    const diagnosis = await runCli(["diagnose", "propagation", "--window", "5000"], true);
    expect(diagnosis).toContain("# Propagation Diagnosis");
    expect(diagnosis).toMatch(
      /store -> render -> error|Render activity overlaps with repeated network work|Propagation data is present but not yet conclusive/,
    );
  });
});

async function runCli(args: string[], allowFail = false): Promise<string> {
  const result = await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolveResult) => {
    const child = spawn("node", [cliPath, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => resolveResult({ code, stdout, stderr }));
  });

  if (!allowFail && result.code !== 0) {
    throw new Error(`cli failed: ${args.join(" ")}\n${result.stderr || result.stdout}`);
  }
  return (result.stdout || result.stderr).trim();
}

async function waitForPort(port: number, timeoutMs: number) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ok = await new Promise<boolean>((resolvePromise) => {
      const socket = connect(port, "127.0.0.1");
      socket.once("connect", () => {
        socket.destroy();
        resolvePromise(true);
      });
      socket.once("error", () => resolvePromise(false));
    });
    if (ok) return;
    await sleep(200);
  }
  throw new Error(`port ${port} did not become ready\n${demoLogs}`);
}

async function stopPortOwner(port: number) {
  const cmd = `for /f "tokens=5" %a in ('netstat -ano ^| findstr LISTENING ^| findstr :${port}') do taskkill /PID %a /T /F`;
  spawnSync("cmd.exe", ["/c", cmd], { stdio: "ignore" });
}
