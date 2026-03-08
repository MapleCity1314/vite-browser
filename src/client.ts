import { connect as netConnect, type Socket } from "node:net";
import { readFileSync, existsSync, rmSync } from "node:fs";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { socketPath, pidFile } from "./paths.js";

export type Response = { ok: true; data?: unknown } | { ok: false; error: string };
export type ClientDeps = {
  socketPath: string;
  pidFile: string;
  existsSync: typeof existsSync;
  readFileSync: typeof readFileSync;
  rmSync: typeof rmSync;
  processKill: typeof process.kill;
  spawn: typeof spawn;
  connect: () => Promise<Socket>;
  sleep: typeof sleep;
  daemonPath: string;
};

export function createClientDeps(): ClientDeps {
  const ext = import.meta.url.endsWith(".ts") ? ".ts" : ".js";
  const daemonPath = fileURLToPath(new URL(`./daemon${ext}`, import.meta.url));
  return {
    socketPath,
    pidFile,
    existsSync,
    readFileSync,
    rmSync,
    processKill: process.kill.bind(process),
    spawn,
    connect,
    sleep,
    daemonPath,
  };
}

export async function send(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<Response> {
  const deps = createClientDeps();
  await ensureDaemon(deps);
  const socket = await deps.connect();
  const id = String(Date.now());
  socket.write(JSON.stringify({ id, action, ...payload }) + "\n");
  const line = await readLine(socket);
  socket.end();
  return JSON.parse(line);
}

export async function ensureDaemon(deps: ClientDeps) {
  if (daemonAlive(deps) && (await deps.connect().then(ok, no))) return;

  const child = deps.spawn(process.execPath, [deps.daemonPath], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  for (let i = 0; i < 50; i++) {
    if (await deps.connect().then(ok, no)) return;
    await deps.sleep(100);
  }
  throw new Error(`daemon failed to start (${deps.socketPath})`);
}

export function daemonAlive(deps: Pick<ClientDeps, "existsSync" | "pidFile" | "readFileSync" | "processKill" | "rmSync" | "socketPath">) {
  if (!deps.existsSync(deps.pidFile)) return false;
  const pid = Number(deps.readFileSync(deps.pidFile, "utf-8"));
  try {
    deps.processKill(pid, 0);
    return true;
  } catch {
    deps.rmSync(deps.pidFile, { force: true });
    removeSocketFile(deps.socketPath, deps.rmSync);
    return false;
  }
}

export function connect(): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = netConnect(socketPath);
    socket.once("connect", () => resolve(socket));
    socket.once("error", reject);
  });
}

export function readLine(socket: Pick<Socket, "on">): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    socket.on("data", (chunk: Buffer | string) => {
      buffer += chunk;
      const newline = buffer.indexOf("\n");
      if (newline >= 0) resolve(buffer.slice(0, newline));
    });
    socket.on("error", reject);
  });
}

export function ok(s: Pick<Socket, "destroy">) {
  s.destroy();
  return true;
}

export function no() {
  return false;
}

export function removeSocketFile(
  path: string,
  removeFile: typeof rmSync = rmSync,
) {
  if (process.platform === "win32") return;
  removeFile(path, { force: true });
}
