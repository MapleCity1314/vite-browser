import { createServer } from "node:net";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import type { Socket } from "node:net";
import { fileURLToPath } from "node:url";
import * as browser from "./browser.js";
import { socketDir, socketPath, pidFile } from "./paths.js";
import { EventQueue } from "./event-queue.js";
import * as networkLog from "./network.js";

export type BrowserApi = typeof browser;
export type Cmd = {
  action: string;
  url?: string;
  id?: string;
  script?: string;
  idx?: number;
  mode?: "summary" | "trace" | "clear" | "snapshot";
  limit?: number;
  filter?: string;
  mapped?: boolean;
  inlineSource?: boolean;
  cookies?: { name: string; value: string }[];
  domain?: string;
  store?: string;
};

export function cleanError(err: unknown) {
  if (!(err instanceof Error)) return String(err);
  const msg = err.message;
  const m = msg.match(/^page\.\w+: (?:Error: )?(.+?)(?:\n|$)/);
  return m ? m[1] : msg;
}

export function createRunner(api: BrowserApi = browser) {
  return async function run(cmd: Cmd) {
    // Flush browser events to daemon queue before processing command
    const queue = api.getEventQueue();
    if (queue) {
      try {
        const currentPage = api.getCurrentPage();
        if (currentPage) {
          await api.flushBrowserEvents(currentPage, queue);
        }
      } catch {
        // Ignore flush errors (page might not be open yet)
      }
    }

    // Browser control
    if (cmd.action === "open") {
      await api.open(cmd.url);
      return { ok: true };
    }
    if (cmd.action === "cookies") {
      const data = await api.cookies(cmd.cookies!, cmd.domain!);
      return { ok: true, data };
    }
    if (cmd.action === "close") {
      await api.close();
      return { ok: true };
    }
    if (cmd.action === "goto") {
      const data = await api.goto(cmd.url!);
      return { ok: true, data };
    }
    if (cmd.action === "back") {
      await api.back();
      return { ok: true };
    }
    if (cmd.action === "reload") {
      const data = await api.reload();
      return { ok: true, data };
    }

    // Framework detection
    if (cmd.action === "detect") {
      const data = await api.detectFramework();
      return { ok: true, data };
    }

    // Vue commands
    if (cmd.action === "vue-tree") {
      const data = await api.vueTree(cmd.id);
      return { ok: true, data };
    }
    if (cmd.action === "vue-pinia") {
      const data = await api.vuePinia(cmd.store);
      return { ok: true, data };
    }
    if (cmd.action === "vue-router") {
      const data = await api.vueRouter();
      return { ok: true, data };
    }

    // React commands
    if (cmd.action === "react-tree") {
      const data = await api.reactTree(cmd.id);
      return { ok: true, data };
    }

    // Svelte commands
    if (cmd.action === "svelte-tree") {
      const data = await api.svelteTree(cmd.id);
      return { ok: true, data };
    }

    // Vite commands
    if (cmd.action === "vite-restart") {
      const data = await api.viteRestart();
      return { ok: true, data };
    }
    if (cmd.action === "vite-hmr") {
      const hmrMode = cmd.mode === "trace" || cmd.mode === "clear" ? cmd.mode : "summary";
      const data = await api.viteHMRTrace(hmrMode, cmd.limit ?? 20);
      return { ok: true, data };
    }
    if (cmd.action === "vite-runtime") {
      const data = await api.viteRuntimeStatus();
      return { ok: true, data };
    }
    if (cmd.action === "vite-module-graph") {
      const graphMode = cmd.mode === "trace" || cmd.mode === "clear" ? cmd.mode : "snapshot";
      const data = await api.viteModuleGraph(cmd.filter, cmd.limit ?? 200, graphMode);
      return { ok: true, data };
    }
    if (cmd.action === "errors") {
      const data = await api.errors(Boolean(cmd.mapped), Boolean(cmd.inlineSource));
      return { ok: true, data };
    }
    if (cmd.action === "logs") {
      const data = await api.logs();
      return { ok: true, data };
    }

    // Utilities
    if (cmd.action === "screenshot") {
      const data = await api.screenshot();
      return { ok: true, data };
    }
    if (cmd.action === "eval") {
      const data = await api.evaluate(cmd.script!);
      return { ok: true, data };
    }
    if (cmd.action === "network") {
      const data = await api.network(cmd.idx);
      return { ok: true, data };
    }

    return { ok: false, error: `unknown action: ${cmd.action}` };
  };
}

export async function dispatchLine(
  line: string,
  socket: Pick<Socket, "write">,
  run = createRunner(),
  onClose?: () => void,
) {
  let cmd: Cmd;
  try {
    cmd = JSON.parse(line);
  } catch {
    socket.write(JSON.stringify({ ok: false, error: "invalid command payload" }) + "\n");
    return;
  }

  const result = await run(cmd).catch((err) => ({ ok: false, error: cleanError(err) }));
  socket.write(JSON.stringify({ id: cmd.id, ...result }) + "\n");
  if (cmd.action === "close") setImmediate(() => onClose?.());
}

export function startDaemon() {
  // Initialize event queue
  const eventQueue = new EventQueue(1000);
  browser.setEventQueue(eventQueue);
  networkLog.setEventQueue(eventQueue);

  const run = createRunner();
  mkdirSync(socketDir, { recursive: true, mode: 0o700 });
  removeSocketFile();
  rmSync(pidFile, { force: true });
  writeFileSync(pidFile, String(process.pid));

  const server = createServer((socket) => {
    let buffer = "";
    socket.on("data", (chunk) => {
      buffer += chunk;
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (line) {
          void dispatchLine(line, socket, run, shutdown);
        }
      }
    });
    socket.on("error", () => {});
  });

  server.listen(socketPath);

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("exit", cleanup);

  function shutdown() {
    cleanup();
    process.exit(0);
  }

  function cleanup() {
    removeSocketFile();
    rmSync(pidFile, { force: true });
  }
}

function removeSocketFile() {
  // Windows named pipes are not filesystem entries, so unlinking them fails with EPERM.
  if (process.platform === "win32") return;
  rmSync(socketPath, { force: true });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  startDaemon();
}
