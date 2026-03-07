import { createServer } from "node:net";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

type CmdResult = { code: number | null; stdout: string; stderr: string };

const resources: Array<() => void> = [];

afterEach(() => {
  while (resources.length > 0) {
    const cleanup = resources.pop();
    cleanup?.();
  }
});

describe("cli smoke", () => {
  it("prints help with svelte commands", async () => {
    const res = await runCli(["--help"]);
    expect(res.code).toBe(0);
    expect(res.stdout).toContain("SVELTE COMMANDS");
    expect(res.stdout).toContain("svelte tree [id]");
  });

  it("handles unknown command", async () => {
    const res = await runCli(["no-such-cmd"]);
    expect(res.code).toBe(1);
    expect(res.stderr).toContain("unknown command");
  });

  it("sends detect command through socket protocol", async () => {
    const session = `test-${process.pid}-${Date.now()}`;
    const { server, pidFile, socketPath } = await startFakeDaemon(session);

    resources.push(() => {
      server.close();
      rmSync(pidFile, { force: true });
      if (process.platform !== "win32") rmSync(socketPath, { force: true });
    });

    const res = await runCli(["detect"], { VITE_BROWSER_SESSION: session });
    expect(res.code).toBe(0);
    expect(res.stdout.trim()).toBe("react@19.0.0");
  });
});

async function startFakeDaemon(session: string) {
  const socketDir = join(homedir(), ".vite-browser");
  const socketPath =
    process.platform === "win32"
      ? `\\\\.\\pipe\\vite-browser-${session}`
      : join(socketDir, `${session}.sock`);
  const pidFile = join(socketDir, `${session}.pid`);

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
          const cmd = JSON.parse(line) as { id: string; action: string };
          let payload: Record<string, unknown>;
          if (cmd.action === "detect") {
            payload = { id: cmd.id, ok: true, data: "react@19.0.0" };
          } else {
            payload = { id: cmd.id, ok: false, error: `unsupported: ${cmd.action}` };
          }
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

  return { server, pidFile, socketPath };
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
