import { copyFileSync, existsSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { connect } from "node:net";
import { resolve } from "node:path";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const cliPath = resolve(process.cwd(), "dist/cli.js");
const pnpmLauncher = resolvePnpmLauncher();
const trackedDemoDir = resolve(process.cwd(), "test/fixtures/vue-app");
const trackedDemoMainTs = resolve(trackedDemoDir, "src/main.ts");
const trackedDemoUrl = "http://127.0.0.1:5173";
const chromeExecutablePath = resolveChromeExecutablePath();

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
      writeFileSync(trackedDemoMainTs, `import './__vite_browser_tmp_missing__'\n${original}`, "utf-8");
      await runCli(["reload"]);
      const mapped = await waitForOutput(["errors", "--mapped"], "Failed to resolve import", 10_000);
      expect(mapped).toContain("Failed to resolve import");

      const mappedInline = await waitForOutput(
        ["errors", "--mapped", "--inline-source"],
        "Failed to resolve import",
        10_000,
      );
      expect(mappedInline).toContain("Failed to resolve import");
    } finally {
      writeFileSync(trackedDemoMainTs, original, "utf-8");
      await runCli(["reload"], true);
      await runCli(["open", trackedDemoUrl], true);
      await waitForOutput(["errors"], "no errors", 10_000);
    }
  });

  it("covers propagation commands with a real Pinia store update", async () => {
    await runCli(["open", trackedDemoUrl]);

    const update = await runCli([
      "eval",
      "(() => { const button = document.querySelector('main button'); if (!(button instanceof HTMLButtonElement)) return { ok: false }; button.click(); return { ok: true, text: button.textContent }; })()",
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
  _usePinnedNode: boolean,
): Promise<ChildProcess> {
  const launcher = resolveDevServerLauncher(dir);
  const child = spawn(launcher.command, [...launcher.args, "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: dir,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env },
  });
  child.stdout?.on("data", (chunk) => onOutput(chunk.toString()));
  child.stderr?.on("data", (chunk) => onOutput(chunk.toString()));
  await waitForPort(port, 60_000, getLogs);
  return child;
}

async function stopDevServer(child: ChildProcess | null, port: number) {
  if (child?.pid) {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", shell: true });
    } else {
      child.kill("SIGTERM");
    }
  }
  await sleep(250);
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
    const child = spawn(process.execPath, [cliPath, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        VITE_BROWSER_HEADLESS: "1",
        ...(chromeExecutablePath ? { VITE_BROWSER_EXECUTABLE_PATH: chromeExecutablePath } : {}),
      },
    });
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
  if (process.platform === "win32") {
    const cmd = `for /f "tokens=5" %a in ('netstat -ano ^| findstr LISTENING ^| findstr :${port}') do taskkill /PID %a /T /F`;
    spawnSync("cmd.exe", ["/c", cmd], { stdio: "ignore" });
    return;
  }

  spawnSync(
    "sh",
    ["-c", `pids=$(lsof -ti tcp:${port} 2>/dev/null); [ -z "$pids" ] || kill -TERM $pids >/dev/null 2>&1 || true`],
    { stdio: "ignore" },
  );
}

function resolvePnpmLauncher(): { command: string; args: string[] } {
  const scriptCandidates = [
    process.env.npm_execpath,
    "/opt/homebrew/bin/pnpm",
    "/usr/local/bin/pnpm",
  ].filter((value): value is string => Boolean(value) && existsSync(value));

  for (const candidate of scriptCandidates) {
    try {
      const scriptPath = realpathSync(candidate);
      return { command: "node", args: [scriptPath] };
    } catch {
      continue;
    }
  }

  const lookup = process.platform === "win32"
    ? spawnSync("where", ["pnpm"], { encoding: "utf-8", shell: true })
    : spawnSync("which", ["pnpm"], { encoding: "utf-8" });
  const match = lookup.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  return { command: match || "pnpm", args: [] };
}

function resolveDevServerLauncher(dir: string): { command: string; args: string[] } {
  const localViteBin = resolve(dir, "node_modules/vite/bin/vite.js");
  if (existsSync(localViteBin)) {
    return { command: process.execPath, args: [localViteBin] };
  }

  return { command: pnpmLauncher.command, args: [...pnpmLauncher.args, "dev"] };
}

function resolveChromeExecutablePath(): string | undefined {
  const candidates = process.platform === "win32"
    ? [
        `${process.env.PROGRAMFILES ?? "C:\\Program Files"}\\Google\\Chrome\\Application\\chrome.exe`,
        `${process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)"}\\Google\\Chrome\\Application\\chrome.exe`,
      ]
    : process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ]
      : [
          "/usr/bin/google-chrome",
          "/usr/bin/chromium",
          "/usr/bin/chromium-browser",
          "/snap/bin/chromium",
        ];

  return candidates.find((candidate) => existsSync(candidate));
}
