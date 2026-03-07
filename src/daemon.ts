import { createServer } from "node:net";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import type { Socket } from "node:net";
import * as browser from "./browser.js";
import { socketDir, socketPath, pidFile } from "./paths.js";

mkdirSync(socketDir, { recursive: true, mode: 0o700 });
rmSync(socketPath, { force: true });
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
      if (line) dispatch(line, socket);
    }
  });
  socket.on("error", () => {});
});

server.listen(socketPath);

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", cleanup);

async function dispatch(line: string, socket: Socket) {
  const cmd = JSON.parse(line);
  const result = await run(cmd).catch((err) => ({ ok: false, error: cleanError(err) }));
  socket.write(JSON.stringify({ id: cmd.id, ...result }) + "\n");
  if (cmd.action === "close") setImmediate(shutdown);
}

function cleanError(err: Error) {
  const msg = err.message;
  const m = msg.match(/^page\.\w+: (?:Error: )?(.+?)(?:\n|$)/);
  return m ? m[1] : msg;
}

type Cmd = {
  action: string;
  url?: string;
  id?: string;
  script?: string;
  idx?: number;
  cookies?: { name: string; value: string }[];
  domain?: string;
  store?: string;
};

async function run(cmd: Cmd) {
  // Browser control
  if (cmd.action === "open") {
    await browser.open(cmd.url);
    return { ok: true };
  }
  if (cmd.action === "cookies") {
    const data = await browser.cookies(cmd.cookies!, cmd.domain!);
    return { ok: true, data };
  }
  if (cmd.action === "close") {
    await browser.close();
    return { ok: true };
  }
  if (cmd.action === "goto") {
    const data = await browser.goto(cmd.url!);
    return { ok: true, data };
  }
  if (cmd.action === "back") {
    await browser.back();
    return { ok: true };
  }
  if (cmd.action === "reload") {
    const data = await browser.reload();
    return { ok: true, data };
  }

  // Framework detection
  if (cmd.action === "detect") {
    const data = await browser.detectFramework();
    return { ok: true, data };
  }

  // Vue commands
  if (cmd.action === "vue-tree") {
    const data = await browser.vueTree(cmd.id);
    return { ok: true, data };
  }
  if (cmd.action === "vue-pinia") {
    const data = await browser.vuePinia(cmd.store);
    return { ok: true, data };
  }
  if (cmd.action === "vue-router") {
    const data = await browser.vueRouter();
    return { ok: true, data };
  }

  // React commands
  if (cmd.action === "react-tree") {
    const data = await browser.reactTree(cmd.id);
    return { ok: true, data };
  }

  // Svelte commands
  if (cmd.action === "svelte-tree") {
    const data = await browser.svelteTree(cmd.id);
    return { ok: true, data };
  }

  // Vite commands
  if (cmd.action === "vite-restart") {
    const data = await browser.viteRestart();
    return { ok: true, data };
  }
  if (cmd.action === "vite-hmr") {
    const data = await browser.viteHMR();
    return { ok: true, data };
  }
  if (cmd.action === "errors") {
    const data = await browser.errors();
    return { ok: true, data };
  }
  if (cmd.action === "logs") {
    const data = await browser.logs();
    return { ok: true, data };
  }

  // Utilities
  if (cmd.action === "screenshot") {
    const data = await browser.screenshot();
    return { ok: true, data };
  }
  if (cmd.action === "eval") {
    const data = await browser.evaluate(cmd.script!);
    return { ok: true, data };
  }
  if (cmd.action === "network") {
    const data = await browser.network(cmd.idx);
    return { ok: true, data };
  }

  return { ok: false, error: `unknown action: ${cmd.action}` };
}

function shutdown() {
  cleanup();
  process.exit(0);
}

function cleanup() {
  rmSync(socketPath, { force: true });
  rmSync(pidFile, { force: true });
}
