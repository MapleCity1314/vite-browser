import { createServer } from "node:net";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";
import { resolveSocketDir } from "../../src/paths.js";

type CmdResult = { code: number | null; stdout: string; stderr: string };
type ReceivedCmd = Record<string, unknown>;

const resources: Array<() => void> = [];

afterEach(() => {
  while (resources.length > 0) {
    resources.pop()?.();
  }
});

describe("cli routing", () => {
  it("routes open with normalized url", async () => {
    const session = `routing-${process.pid}-${Date.now()}-open`;
    const daemon = await startInspectDaemon(session);
    registerCleanup(daemon);

    const res = await runCli(["open", "127.0.0.1:5173"], { VITE_BROWSER_SESSION: session });
    expect(res.code).toBe(0);
    expect(daemon.received).toHaveLength(1);
    expect(daemon.received[0]).toMatchObject({
      action: "open",
      url: "http://127.0.0.1:5173",
    });
  });

  it("routes open with cookies as open + cookies + goto", async () => {
    const session = `routing-${process.pid}-${Date.now()}-cookies`;
    const daemon = await startInspectDaemon(session);
    registerCleanup(daemon);

    const tmp = resolve(process.cwd(), `.tmp.cookies.${process.pid}.${Date.now()}.json`);
    writeFileSync(tmp, JSON.stringify([{ name: "token", value: "abc" }], null, 2));
    resources.push(() => rmSync(tmp, { force: true }));

    const res = await runCli(
      ["open", "127.0.0.1:5173", "--cookies-json", tmp],
      { VITE_BROWSER_SESSION: session },
    );
    expect(res.code).toBe(0);
    expect(daemon.received).toHaveLength(3);
    expect(daemon.received[0]).toMatchObject({ action: "open" });
    expect(daemon.received[1]).toMatchObject({
      action: "cookies",
      domain: "127.0.0.1",
      cookies: [{ name: "token", value: "abc" }],
    });
    expect(daemon.received[2]).toMatchObject({
      action: "goto",
      url: "http://127.0.0.1:5173",
    });
  });

  it("routes vite hmr trace mode and limit", async () => {
    const session = `routing-${process.pid}-${Date.now()}-hmr`;
    const daemon = await startInspectDaemon(session);
    registerCleanup(daemon);

    const res = await runCli(
      ["vite", "hmr", "trace", "--limit", "33"],
      { VITE_BROWSER_SESSION: session },
    );
    expect(res.code).toBe(0);
    expect(daemon.received[0]).toMatchObject({
      action: "vite-hmr",
      mode: "trace",
      limit: 33,
    });
  });

  it("routes vite module-graph trace mode, filter, and limit", async () => {
    const session = `routing-${process.pid}-${Date.now()}-graph-trace`;
    const daemon = await startInspectDaemon(session);
    registerCleanup(daemon);

    const res = await runCli(
      ["vite", "module-graph", "trace", "--filter", "/src/", "--limit", "7"],
      { VITE_BROWSER_SESSION: session },
    );
    expect(res.code).toBe(0);
    expect(daemon.received[0]).toMatchObject({
      action: "vite-module-graph",
      mode: "trace",
      filter: "/src/",
      limit: 7,
    });
  });

  it("routes vite module-graph clear mode", async () => {
    const session = `routing-${process.pid}-${Date.now()}-graph-clear`;
    const daemon = await startInspectDaemon(session);
    registerCleanup(daemon);

    const res = await runCli(
      ["vite", "module-graph", "clear"],
      { VITE_BROWSER_SESSION: session },
    );
    expect(res.code).toBe(0);
    expect(daemon.received[0]).toMatchObject({
      action: "vite-module-graph",
      mode: "clear",
    });
  });

  it("routes errors mapped with inline-source flags", async () => {
    const session = `routing-${process.pid}-${Date.now()}-errors`;
    const daemon = await startInspectDaemon(session);
    registerCleanup(daemon);

    const res = await runCli(
      ["errors", "--mapped", "--inline-source"],
      { VITE_BROWSER_SESSION: session },
    );
    expect(res.code).toBe(0);
    expect(daemon.received[0]).toMatchObject({
      action: "errors",
      mapped: true,
      inlineSource: true,
    });
  });

  it("routes correlate errors with window flag", async () => {
    const session = `routing-${process.pid}-${Date.now()}-correlate`;
    const daemon = await startInspectDaemon(session);
    registerCleanup(daemon);

    const res = await runCli(
      ["correlate", "errors", "--mapped", "--window", "9000"],
      { VITE_BROWSER_SESSION: session },
    );
    expect(res.code).toBe(0);
    expect(daemon.received[0]).toMatchObject({
      action: "correlate-errors",
      mapped: true,
      windowMs: 9000,
    });
  });

  it("routes diagnose hmr with limit and window flags", async () => {
    const session = `routing-${process.pid}-${Date.now()}-diagnose`;
    const daemon = await startInspectDaemon(session);
    registerCleanup(daemon);

    const res = await runCli(
      ["diagnose", "hmr", "--limit", "25", "--window", "7000"],
      { VITE_BROWSER_SESSION: session },
    );
    expect(res.code).toBe(0);
    expect(daemon.received[0]).toMatchObject({
      action: "diagnose-hmr",
      limit: 25,
      windowMs: 7000,
    });
  });

  it("routes correlate renders and diagnose propagation", async () => {
    const session = `routing-${process.pid}-${Date.now()}-propagation`;
    const daemon = await startInspectDaemon(session);
    registerCleanup(daemon);

    const correlateRes = await runCli(
      ["correlate", "renders", "--window", "6000"],
      { VITE_BROWSER_SESSION: session },
    );
    expect(correlateRes.code).toBe(0);
    expect(daemon.received[0]).toMatchObject({
      action: "correlate-renders",
      windowMs: 6000,
    });

    const diagnoseRes = await runCli(
      ["diagnose", "propagation", "--window", "6000"],
      { VITE_BROWSER_SESSION: session },
    );
    expect(diagnoseRes.code).toBe(0);
    expect(daemon.received[1]).toMatchObject({
      action: "diagnose-propagation",
      windowMs: 6000,
    });
  });

  it("routes framework and utility commands", async () => {
    const session = `routing-${process.pid}-${Date.now()}-misc`;
    const daemon = await startInspectDaemon(session);
    registerCleanup(daemon);

    const commands: Array<{ args: string[]; expected: Record<string, unknown> }> = [
      { args: ["vue", "tree", "9"], expected: { action: "vue-tree", id: "9" } },
      { args: ["vue", "pinia", "cart"], expected: { action: "vue-pinia", store: "cart" } },
      { args: ["vue", "router"], expected: { action: "vue-router" } },
      { args: ["react", "tree", "3"], expected: { action: "react-tree", id: "3" } },
      { args: ["react", "store", "list"], expected: { action: "react-store-list" } },
      { args: ["react", "store", "inspect", "cart"], expected: { action: "react-store-inspect", store: "cart" } },
      { args: ["react", "hook", "health"], expected: { action: "react-hook-health" } },
      { args: ["react", "hook", "inject"], expected: { action: "react-hook-inject" } },
      { args: ["react", "commits", "--limit", "7"], expected: { action: "react-commits", limit: 7 } },
      { args: ["react", "commits", "clear"], expected: { action: "react-commits-clear" } },
      { args: ["svelte", "tree", "2"], expected: { action: "svelte-tree", id: "2" } },
      { args: ["vite", "runtime"], expected: { action: "vite-runtime" } },
      { args: ["network", "5"], expected: { action: "network", idx: 5 } },
      { args: ["eval", "document.title"], expected: { action: "eval", script: "document.title" } },
      { args: ["logs"], expected: { action: "logs" } },
      { args: ["screenshot"], expected: { action: "screenshot" } },
    ];

    for (const item of commands) {
      const res = await runCli(item.args, { VITE_BROWSER_SESSION: session });
      expect(res.code).toBe(0);
      const got = daemon.received[daemon.received.length - 1];
      expect(got).toMatchObject(item.expected);
    }
  });
});

function registerCleanup(daemon: Awaited<ReturnType<typeof startInspectDaemon>>) {
  resources.push(() => {
    daemon.server.close();
    rmSync(daemon.pidFile, { force: true });
    if (process.platform !== "win32") rmSync(daemon.socketPath, { force: true });
  });
}

async function startInspectDaemon(session: string) {
  const socketDir = resolveSocketDir();
  const socketPath =
    process.platform === "win32"
      ? `\\\\.\\pipe\\vite-browser-${session}`
      : join(socketDir, `${session}.sock`);
  const pidFile = join(socketDir, `${session}.pid`);
  const received: ReceivedCmd[] = [];

  mkdirSync(socketDir, { recursive: true });
  if (process.platform !== "win32") rmSync(socketPath, { force: true });

  const server = createServer((socket) => {
    let buffer = "";
    socket.on("data", (chunk) => {
      buffer += chunk.toString();
      let idx = buffer.indexOf("\n");
      while (idx >= 0) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line) {
          const cmd = JSON.parse(line) as Record<string, unknown>;
          received.push(cmd);
          const action = String(cmd.action || "");
          const payload = { id: cmd.id, ok: true, data: dataFor(action) };
          socket.write(JSON.stringify(payload) + "\n");
        }
        idx = buffer.indexOf("\n");
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(socketPath, () => resolve());
  });

  writeFileSync(pidFile, String(process.pid));
  return { server, pidFile, socketPath, received };
}

function dataFor(action: string): string {
  if (action === "goto" || action === "reload") return "http://127.0.0.1:5173/";
  if (action === "detect") return "vue@3.5.0";
  if (action === "vite-runtime") return "# Vite Runtime";
  if (action === "vite-hmr") return "# HMR Summary";
  if (action === "vite-module-graph") return "# Vite Module Graph";
  if (action === "errors") return "# Mapped Stack";
  if (action === "network") return "# Network";
  if (action === "screenshot") return "C:\\tmp\\shot.png";
  return "ok";
}

function runCli(args: string[], env: Record<string, string> = {}): Promise<CmdResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["--import", "tsx", "src/cli.ts", ...args], {
      cwd: process.cwd(),
      env: { ...process.env, ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}
