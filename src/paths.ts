import { homedir } from "node:os";
import { join } from "node:path";

const isWindows = process.platform === "win32";
const session = process.env.VITE_BROWSER_SESSION || "default";

export const socketDir = join(homedir(), ".vite-browser");
export const socketPath = isWindows
  ? `\\\\.\\pipe\\vite-browser-${session}`
  : join(socketDir, `${session}.sock`);
export const pidFile = join(socketDir, `${session}.pid`);
