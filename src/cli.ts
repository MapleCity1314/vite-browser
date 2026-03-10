#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { send, type Response } from "./client.js";

export type CliIo = {
  send: typeof send;
  readFile: (path: string, encoding: BufferEncoding) => string;
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  exit: (code: number) => never;
};

export function normalizeUrl(value: string): string {
  if (value.includes("://")) return value;
  return `http://${value}`;
}

export function parseNumberFlag(args: string[], name: string, fallback: number): number {
  const idx = args.indexOf(name);
  if (idx < 0) return fallback;
  return Number.parseInt(args[idx + 1] ?? String(fallback), 10);
}

export async function runCli(argv: string[], io: CliIo) {
  const args = argv.slice(2);
  const cmd = args[0];
  const arg = args[1];

  if (cmd === "--help" || cmd === "-h" || !cmd) {
    io.stdout(printUsage());
    io.exit(0);
  }

  if (cmd === "open") {
    if (!arg) {
      io.stderr("usage: vite-browser open <url> [--cookies-json <file>]");
      io.exit(1);
    }
    const url = normalizeUrl(arg);
    const cookieIdx = args.indexOf("--cookies-json");
    const cookieFile = cookieIdx >= 0 ? args[cookieIdx + 1] : undefined;

    if (cookieFile) {
      const res = await io.send("open");
      if (!res.ok) exit(io, res, "");
      const raw = io.readFile(cookieFile, "utf-8");
      const cookies = JSON.parse(raw);
      const domain = new URL(url).hostname;
      const cRes = await io.send("cookies", { cookies, domain });
      if (!cRes.ok) exit(io, cRes, "");
      await io.send("goto", { url });
      exit(io, res, `opened -> ${url} (${cookies.length} cookies for ${domain})`);
    }

    const res = await io.send("open", { url });
    exit(io, res, `opened -> ${url}`);
  }

  if (cmd === "close") {
    const res = await io.send("close");
    exit(io, res, "closed");
  }

  if (cmd === "goto") {
    if (!arg) {
      io.stderr("usage: vite-browser goto <url>");
      io.exit(1);
    }
    const res = await io.send("goto", { url: normalizeUrl(arg) });
    exit(io, res, res.ok ? `-> ${res.data}` : "");
  }

  if (cmd === "back") {
    const res = await io.send("back");
    exit(io, res, "back");
  }

  if (cmd === "reload") {
    const res = await io.send("reload");
    exit(io, res, res.ok ? `reloaded -> ${res.data}` : "");
  }

  if (cmd === "detect") {
    const res = await io.send("detect");
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "vue" && arg === "tree") {
    const id = args[2];
    const res = await io.send("vue-tree", { id });
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "vue" && arg === "pinia") {
    const store = args[2];
    const res = await io.send("vue-pinia", { store });
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "vue" && arg === "router") {
    const res = await io.send("vue-router");
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "react" && arg === "tree") {
    const id = args[2];
    const res = await io.send("react-tree", { id });
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "svelte" && arg === "tree") {
    const id = args[2];
    const res = await io.send("svelte-tree", { id });
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "vite" && arg === "restart") {
    const res = await io.send("vite-restart");
    exit(io, res, res.ok && res.data ? String(res.data) : "restarted");
  }

  if (cmd === "vite" && arg === "hmr") {
    const sub = args[2];
    if (sub === "clear") {
      const res = await io.send("vite-hmr", { mode: "clear" });
      exit(io, res, res.ok && res.data ? String(res.data) : "cleared HMR trace");
    }

    if (sub === "trace") {
      const limit = parseNumberFlag(args, "--limit", 20);
      const res = await io.send("vite-hmr", { mode: "trace", limit });
      exit(io, res, res.ok && res.data ? String(res.data) : "");
    }

    const res = await io.send("vite-hmr", { mode: "summary", limit: 20 });
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "vite" && arg === "runtime") {
    const res = await io.send("vite-runtime");
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "vite" && arg === "module-graph") {
    const sub = args[2];
    const filterIdx = args.indexOf("--filter");
    const filter = filterIdx >= 0 ? args[filterIdx + 1] : undefined;
    const limit = parseNumberFlag(args, "--limit", 200);
    if (sub === "clear") {
      const res = await io.send("vite-module-graph", { mode: "clear" });
      exit(io, res, res.ok && res.data ? String(res.data) : "cleared module-graph baseline");
    }
    if (sub === "trace") {
      const res = await io.send("vite-module-graph", { mode: "trace", filter, limit });
      exit(io, res, res.ok && res.data ? String(res.data) : "");
    }
    const res = await io.send("vite-module-graph", { mode: "snapshot", filter, limit });
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "errors") {
    const mapped = args.includes("--mapped");
    const inlineSource = args.includes("--inline-source");
    const res = await io.send("errors", { mapped, inlineSource });
    exit(io, res, res.ok && res.data ? String(res.data) : "no errors");
  }

  if (cmd === "correlate" && arg === "errors") {
    const mapped = args.includes("--mapped");
    const inlineSource = args.includes("--inline-source");
    const windowMs = parseNumberFlag(args, "--window", 5000);
    const res = await io.send("correlate-errors", { mapped, inlineSource, windowMs });
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "correlate" && arg === "renders") {
    const windowMs = parseNumberFlag(args, "--window", 5000);
    const res = await io.send("correlate-renders", { windowMs });
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "diagnose" && arg === "hmr") {
    const mapped = args.includes("--mapped");
    const inlineSource = args.includes("--inline-source");
    const windowMs = parseNumberFlag(args, "--window", 5000);
    const limit = parseNumberFlag(args, "--limit", 50);
    const res = await io.send("diagnose-hmr", { mapped, inlineSource, windowMs, limit });
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "diagnose" && arg === "propagation") {
    const windowMs = parseNumberFlag(args, "--window", 5000);
    const res = await io.send("diagnose-propagation", { windowMs });
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "logs") {
    const res = await io.send("logs");
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "screenshot") {
    const res = await io.send("screenshot");
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "eval") {
    if (!arg) {
      io.stderr("usage: vite-browser eval <script>");
      io.exit(1);
    }
    const res = await io.send("eval", { script: arg });
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  if (cmd === "network") {
    const idx = arg ? parseInt(arg, 10) : undefined;
    const res = await io.send("network", { idx });
    exit(io, res, res.ok && res.data ? String(res.data) : "");
  }

  io.stderr(`unknown command: ${cmd}`);
  io.exit(1);
}

export function exit(io: Pick<CliIo, "stdout" | "stderr" | "exit">, res: Response, msg: string): never {
  if (!res.ok) {
    io.stderr(res.error || "error");
    io.exit(1);
  }
  if (msg) io.stdout(msg);
  io.exit(0);
}

export function printUsage() {
  return `
vite-browser - Programmatic access to Vue/React/Svelte DevTools and Vite dev server

USAGE
  vite-browser <command> [options]

BROWSER CONTROL
  open <url> [--cookies-json <file>]  Launch browser and navigate
  close                               Close browser and daemon
  goto <url>                          Full-page navigation
  back                                Go back in history
  reload                              Reload current page

FRAMEWORK DETECTION
  detect                              Detect framework (vue/react/svelte)

VUE COMMANDS
  vue tree [id]                       Show Vue component tree or inspect component
  vue pinia [store]                   Show Pinia stores or inspect specific store
  vue router                          Show Vue Router information

REACT COMMANDS
  react tree [id]                     Show React component tree or inspect component

SVELTE COMMANDS
  svelte tree [id]                    Show Svelte component tree or inspect component

VITE COMMANDS
  vite restart                        Restart Vite dev server
  vite hmr                            Show HMR summary
  vite hmr trace [--limit <n>]        Show HMR timeline
  vite hmr clear                      Clear tracked HMR timeline
  vite runtime                        Show Vite runtime status
  vite module-graph [--filter <txt>] [--limit <n>]
                                     Show loaded Vite module resources
  vite module-graph trace [--filter <txt>] [--limit <n>]
                                     Show module additions/removals since baseline
  vite module-graph clear             Clear module-graph baseline
  errors                              Show build/runtime errors
  errors --mapped                     Show errors with source-map mapping
  errors --mapped --inline-source     Include mapped source snippets
  correlate errors [--window <ms>]    Correlate current errors with recent HMR events
  correlate renders [--window <ms>]   Summarize recent render/update propagation evidence
  correlate errors --mapped           Correlate mapped errors with recent HMR events
  diagnose hmr [--window <ms>]        Diagnose HMR failures from runtime, errors, and trace data
  diagnose hmr [--limit <n>]          Control how many recent HMR trace entries are inspected
  diagnose propagation [--window <ms>]
                                     Diagnose likely update -> render -> error propagation
  logs                                Show dev server logs

UTILITIES
  screenshot                          Save screenshot to temp file
  eval <script>                       Evaluate JavaScript in page context
  network [idx]                       List network requests or inspect one

OPTIONS
  -h, --help                          Show this help message
`;
}

function isEntrypoint(argv1: string | undefined): boolean {
  return Boolean(argv1 && import.meta.url.endsWith(argv1.replaceAll("\\", "/")));
}

async function main() {
  await runCli(process.argv, {
    send,
    readFile: readFileSync,
    stdout: (text) => console.log(text),
    stderr: (text) => console.error(text),
    exit: (code) => process.exit(code),
  });
}

if (isEntrypoint(process.argv[1])) {
  void main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  });
}
