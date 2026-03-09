import { spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";

export type CmdResult = { code: number | null; stdout: string; stderr: string };
export type EvalCmd = {
  id: string;
  action: string;
  mode?: string;
  limit?: number;
  windowMs?: number;
  filter?: string;
  mapped?: boolean;
  inlineSource?: boolean;
  idx?: number;
};

type Handler = (cmd: EvalCmd) => { ok: boolean; data?: string; error?: string };

export async function startEvalDaemon(session: string, handler: Handler) {
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
          const cmd = JSON.parse(line) as EvalCmd;
          const result = handler(cmd);
          socket.write(JSON.stringify({ id: cmd.id, ...result }) + "\n");
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

  const cleanup = () => {
    server.close();
    rmSync(pidFile, { force: true });
    if (process.platform !== "win32") rmSync(socketPath, { force: true });
  };

  return { cleanup };
}

export function runCli(args: string[], env: Record<string, string> = {}): Promise<CmdResult> {
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
