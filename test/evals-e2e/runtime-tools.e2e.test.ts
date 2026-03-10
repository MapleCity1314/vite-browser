import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { connect } from "node:net";
import { resolve } from "node:path";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const cliPath = resolve(process.cwd(), "dist/cli.js");
const pnpmCjs = "C:\\Users\\murde\\AppData\\Roaming\\npm\\node_modules\\pnpm\\bin\\pnpm.cjs";
const npxCmd = "C:\\Program Files\\nodejs\\npx.cmd";

const trackedDemoDir = resolve(process.cwd(), "../demo");
const trackedDemoMainTs = resolve(trackedDemoDir, "src/main.ts");
const trackedDemoUrl = "http://127.0.0.1:5173";

const localDemoGifDir = resolve(process.cwd(), "demo-gif");
const localDemoGifExists = existsSync(localDemoGifDir);
const localDemoGifMainTs = resolve(localDemoGifDir, "src/main.ts");
const localDemoGifCartTs = resolve(localDemoGifDir, "src/stores/cart.ts");
const localDemoGifCartStableTs = resolve(localDemoGifDir, "src/stores/cart.stable.ts");
const localDemoGifCartBugTs = resolve(localDemoGifDir, "src/stores/cart.bug.ts");
const localDemoGifUrl = "http://127.0.0.1:4173";

let demoProc: ChildProcess | null = null;
let demoLogs = "";
let demoGifProc: ChildProcess | null = null;
let demoGifLogs = "";

describe.sequential("evals-e2e: vite runtime tools", () => {
  beforeAll(async () => {
    await stopPortOwner(5173);
    demoProc = await startDevServer(
      trackedDemoDir,
      5173,
      (chunk) => (demoLogs += chunk),
      () => demoLogs,
      true,
    );
    await runCli(["close"], true);
  });

  afterAll(async () => {
    await runCli(["close"], true);
    await stopDevServer(demoProc, 5173);
  });

  it("covers runtime/hmr/module-graph commands", async () => {
    await runCli(["open", trackedDemoUrl]);

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
    const original = readFileSync(trackedDemoMainTs, "utf-8");
    try {
      writeFileSync(trackedDemoMainTs, `${original}\nimport './__vite_browser_tmp_missing__'\n`, "utf-8");
      await runCli(["reload"]);
      await sleep(1500);

      const mapped = await runCli(["errors", "--mapped"]);
      expect(mapped).toContain("Failed to resolve import");

      const mappedInline = await runCli(["errors", "--mapped", "--inline-source"]);
      expect(mappedInline).toContain("Failed to resolve import");
    } finally {
      writeFileSync(trackedDemoMainTs, original, "utf-8");
      await runCli(["reload"], true);
      await waitForOutput(["errors"], "no errors", 10_000);
    }
  });

  it("covers propagation commands with a real Pinia store update", async () => {
    await runCli(["open", trackedDemoUrl]);

    const update = await runCli([
      "eval",
      "(() => { const store = window.__PINIA__?._s?.get('cart'); if (!store || !store.products?.[0]) return { ok: false }; store.addToCart(store.products[0]); return { ok: true, totalItems: store.totalItems }; })()",
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

if (localDemoGifExists) {
  describe.sequential("evals-e2e: local demo-gif stability", () => {
    beforeAll(async () => {
      await stopPortOwner(4173);
      switchStoreVariant("stable");
      demoGifProc = await startDevServer(
        localDemoGifDir,
        4173,
        (chunk) => (demoGifLogs += chunk),
        () => demoGifLogs,
        false,
      );
      await runCli(["close"], true);
    });

    afterAll(async () => {
      switchStoreVariant("stable");
      await runCli(["close"], true);
      await stopDevServer(demoGifProc, 4173);
    });

    it("reproduces the real demo-gif propagation chain without manual event injection", async () => {
      switchStoreVariant("stable");
      await runCli(["close"], true);
      await runCli(["open", localDemoGifUrl]);

      const stableText = await runCli(["eval", "document.body.innerText"]);
      expect(stableText).toContain("$287.00");

      await runCli(["vite", "hmr", "clear"]);

      try {
        switchStoreVariant("bug");

        const errors = await waitForOutput(["errors", "--mapped", "--inline-source"], "CartSummary.vue", 10_000);
        expect(errors).toContain("Cannot read properties of undefined");
        expect(errors).toContain("CartSummary.vue");

        const errorCorrelation = await runCli(["correlate", "errors", "--mapped", "--window", "5000"]);
        expect(errorCorrelation).toContain("# Error Correlation");
        expect(errorCorrelation).toContain("Confidence: high");
        expect(errorCorrelation).toContain("/src/stores/cart.ts");

        const renderCorrelation = await runCli(["correlate", "renders", "--window", "5000"]);
        expect(renderCorrelation).toContain("# Render Correlation");
        expect(renderCorrelation).toContain("## Source Updates");
        expect(renderCorrelation).toContain("/src/stores/cart.ts");
        expect(renderCorrelation).toContain("## Store Updates");
        expect(renderCorrelation).toContain("cart");
        expect(renderCorrelation).toContain("## Changed Keys");
        expect(renderCorrelation).toContain("items");
        expect(renderCorrelation).toContain("App > ShoppingCart > CartSummary");

        const diagnosis = await runCli(["diagnose", "propagation", "--window", "5000"]);
        expect(diagnosis).toContain("# Propagation Diagnosis");
        expect(diagnosis).toContain("Status: fail");
        expect(diagnosis).toContain("store -> render -> error");
        expect(diagnosis).toContain("Changed keys: items.");
      } finally {
        switchStoreVariant("stable");
        await runCli(["reload"], true);
        await waitForOutput(["errors"], "no errors", 10_000);
      }
    });

    it("clears runtime errors after recovering the demo-gif store without closing the browser", async () => {
      switchStoreVariant("stable");
      await runCli(["close"], true);
      await runCli(["open", localDemoGifUrl]);
      await runCli(["vite", "hmr", "clear"]);

      try {
        switchStoreVariant("bug");
        const broken = await waitForOutput(["errors"], "Cannot read properties of undefined", 10_000);
        expect(broken).toContain("Cannot read properties of undefined");

        switchStoreVariant("stable");
        await runCli(["reload"]);

        const recoveredErrors = await waitForOutput(["errors"], "no errors", 10_000);
        expect(recoveredErrors).toContain("no errors");

        const pageText = await waitForOutput(["eval", "document.body.innerText"], "$287.00", 10_000);
        expect(pageText).toContain("$287.00");
      } finally {
        switchStoreVariant("stable");
        await runCli(["reload"], true);
        await waitForOutput(["errors"], "no errors", 10_000);
      }
    });

    it("keeps the browser session usable across repeated close/open/errors loops", async () => {
      switchStoreVariant("stable");

      for (let index = 0; index < 3; index++) {
        const closeOutput = await runCli(["close"], true);
        const openOutput = await runCli(["open", localDemoGifUrl], true);
        const errorsOutput = await runCli(["errors"], true);

        expect(`${closeOutput}\n${openOutput}\n${errorsOutput}`).not.toContain("browser not open");
        expect(`${closeOutput}\n${openOutput}\n${errorsOutput}`).not.toContain("Target.createTarget");
        expect(errorsOutput).toContain("no errors");
      }
    }, 180_000);
  });
}

function switchStoreVariant(variant: "stable" | "bug") {
  copyFileSync(variant === "stable" ? localDemoGifCartStableTs : localDemoGifCartBugTs, localDemoGifCartTs);
}

async function startDevServer(
  dir: string,
  port: number,
  onOutput: (chunk: string) => void,
  getLogs: () => string,
  usePinnedNode: boolean,
): Promise<ChildProcess> {
  const child = usePinnedNode
    ? spawn(
        `"${npxCmd}" -y node@22.12.0 "${pnpmCjs}" dev --host 127.0.0.1 --port ${port} --strictPort`,
        {
          cwd: dir,
          stdio: ["ignore", "pipe", "pipe"],
          shell: true,
        },
      )
    : spawn(process.execPath, [pnpmCjs, "dev", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
        cwd: dir,
        stdio: ["ignore", "pipe", "pipe"],
      });
  child.stdout?.on("data", (chunk) => onOutput(chunk.toString()));
  child.stderr?.on("data", (chunk) => onOutput(chunk.toString()));
  await waitForPort(port, 60_000, getLogs);
  return child;
}

async function stopDevServer(child: ChildProcess | null, port: number) {
  if (child?.pid) {
    spawnSync("cmd.exe", ["/c", `taskkill /PID ${child.pid} /T /F`], { stdio: "ignore" });
  }
  await stopPortOwner(port);
}

async function waitForOutput(args: string[], expected: string, timeoutMs: number): Promise<string> {
  const started = Date.now();
  let last = "";

  while (Date.now() - started < timeoutMs) {
    last = await runCli(args, true);
    if (last.includes(expected)) return last;
    await sleep(250);
  }

  throw new Error(`timed out waiting for ${expected}\nLast output:\n${last}`);
}

async function runCli(args: string[], allowFail = false): Promise<string> {
  const result = await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolveResult) => {
    const child = spawn("node", [cliPath, ...args], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("close", (code) => resolveResult({ code, stdout, stderr }));
  });

  if (!allowFail && result.code !== 0) {
    throw new Error(`cli failed: ${args.join(" ")}\n${result.stderr || result.stdout}`);
  }

  return (result.stdout || result.stderr).trim();
}

async function waitForPort(port: number, timeoutMs: number, getLogs: () => string) {
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

  throw new Error(`port ${port} did not become ready\n${getLogs()}`);
}

async function stopPortOwner(port: number) {
  const cmd = `for /f "tokens=5" %a in ('netstat -ano ^| findstr LISTENING ^| findstr :${port}') do taskkill /PID %a /T /F`;
  spawnSync("cmd.exe", ["/c", cmd], { stdio: "ignore" });
}
