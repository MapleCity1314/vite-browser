import { homedir } from "node:os";
import { join } from "node:path";

const isWindows = process.platform === "win32";

export const socketDir = join(homedir(), ".vite-browser");
export const socketPath = isWindows
  ? "\\\\.\\pipe\\vite-browser-default"
  : join(socketDir, "default.sock");
export const pidFile = join(socketDir, "default.pid");
