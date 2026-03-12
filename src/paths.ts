import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

export const isWindows = process.platform === "win32";
export const isLinux = process.platform === "linux";

/**
 * Sanitize a session name for safe use in file paths and pipe names.
 */
export function sanitizeSession(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
}

const session = sanitizeSession(process.env.VITE_BROWSER_SESSION || "default");

/**
 * Resolve the base directory for vite-browser runtime files.
 *
 * Uses `~/.vite-browser` on all platforms.
 * Falls back to `$TMPDIR/vite-browser-<uid>` when the home directory
 * is not writable (e.g. some CI/container environments).
 */
export function resolveSocketDir(): string {
  try {
    const home = homedir();
    if (home) return join(home, ".vite-browser");
  } catch {
    // homedir() can throw on misconfigured systems
  }
  // Fallback: use tmpdir scoped by uid to avoid collisions
  const uid = process.getuid?.() ?? process.pid;
  return join(tmpdir(), `vite-browser-${uid}`);
}

export const socketDir = resolveSocketDir();

/**
 * Socket path for the daemon.
 *
 * - Windows: uses a named pipe `\\.\pipe\vite-browser-<session>`
 * - Unix: uses a Unix domain socket file in socketDir
 *
 * Note: Unix socket paths have a ~104-char limit on macOS and ~108 on
 * Linux.  The `~/.vite-browser/<session>.sock` path is well within
 * that range.  The tmpdir fallback may produce longer paths; we keep
 * them short by using numeric uid.
 */
export const socketPath = isWindows
  ? `\\\\.\\pipe\\vite-browser-${session}`
  : join(socketDir, `${session}.sock`);

export const pidFile = join(socketDir, `${session}.pid`);
