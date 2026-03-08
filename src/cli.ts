#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { send } from "./client.js";

const args = process.argv.slice(2);
const cmd = args[0];
const arg = args[1];

if (cmd === "--help" || cmd === "-h" || !cmd) {
  printUsage();
  process.exit(0);
}

if (cmd === "open") {
  if (!arg) {
    console.error("usage: vite-browser open <url> [--cookies-json <file>]");
    process.exit(1);
  }
  const url = normalizeUrl(arg);
  const cookieIdx = args.indexOf("--cookies-json");
  const cookieFile = cookieIdx >= 0 ? args[cookieIdx + 1] : undefined;

  if (cookieFile) {
    const res = await send("open");
    if (!res.ok) exit(res, "");
    const raw = readFileSync(cookieFile, "utf-8");
    const cookies = JSON.parse(raw);
    const domain = new URL(url).hostname;
    const cRes = await send("cookies", { cookies, domain });
    if (!cRes.ok) exit(cRes, "");
    await send("goto", { url });
    exit(res, `opened -> ${url} (${cookies.length} cookies for ${domain})`);
  }

  const res = await send("open", { url });
  exit(res, `opened -> ${url}`);
}

if (cmd === "close") {
  const res = await send("close");
  exit(res, "closed");
}

if (cmd === "goto") {
  if (!arg) {
    console.error("usage: vite-browser goto <url>");
    process.exit(1);
  }
  const res = await send("goto", { url: normalizeUrl(arg) });
  exit(res, res.ok ? `-> ${res.data}` : "");
}

if (cmd === "back") {
  const res = await send("back");
  exit(res, "back");
}

if (cmd === "reload") {
  const res = await send("reload");
  exit(res, res.ok ? `reloaded -> ${res.data}` : "");
}

if (cmd === "detect") {
  const res = await send("detect");
  exit(res, res.ok && res.data ? String(res.data) : "");
}

if (cmd === "vue" && arg === "tree") {
  const id = args[2];
  const res = await send("vue-tree", { id });
  exit(res, res.ok && res.data ? String(res.data) : "");
}

if (cmd === "vue" && arg === "pinia") {
  const store = args[2];
  const res = await send("vue-pinia", { store });
  exit(res, res.ok && res.data ? String(res.data) : "");
}

if (cmd === "vue" && arg === "router") {
  const res = await send("vue-router");
  exit(res, res.ok && res.data ? String(res.data) : "");
}

if (cmd === "react" && arg === "tree") {
  const id = args[2];
  const res = await send("react-tree", { id });
  exit(res, res.ok && res.data ? String(res.data) : "");
}

if (cmd === "svelte" && arg === "tree") {
  const id = args[2];
  const res = await send("svelte-tree", { id });
  exit(res, res.ok && res.data ? String(res.data) : "");
}

if (cmd === "vite" && arg === "restart") {
  const res = await send("vite-restart");
  exit(res, res.ok && res.data ? String(res.data) : "restarted");
}

if (cmd === "vite" && arg === "hmr") {
  const sub = args[2];
  if (sub === "clear") {
    const res = await send("vite-hmr", { mode: "clear" });
    exit(res, res.ok && res.data ? String(res.data) : "cleared HMR trace");
  }

  if (sub === "trace") {
    const limitIdx = args.indexOf("--limit");
    const limit = limitIdx >= 0 ? Number.parseInt(args[limitIdx + 1] ?? "20", 10) : 20;
    const res = await send("vite-hmr", { mode: "trace", limit });
    exit(res, res.ok && res.data ? String(res.data) : "");
  }

  const res = await send("vite-hmr", { mode: "summary", limit: 20 });
  exit(res, res.ok && res.data ? String(res.data) : "");
}

if (cmd === "vite" && arg === "runtime") {
  const res = await send("vite-runtime");
  exit(res, res.ok && res.data ? String(res.data) : "");
}

if (cmd === "vite" && arg === "module-graph") {
  const sub = args[2];
  const filterIdx = args.indexOf("--filter");
  const limitIdx = args.indexOf("--limit");
  const filter = filterIdx >= 0 ? args[filterIdx + 1] : undefined;
  const limit = limitIdx >= 0 ? Number.parseInt(args[limitIdx + 1] ?? "200", 10) : 200;
  if (sub === "clear") {
    const res = await send("vite-module-graph", { mode: "clear" });
    exit(res, res.ok && res.data ? String(res.data) : "cleared module-graph baseline");
  }
  if (sub === "trace") {
    const res = await send("vite-module-graph", { mode: "trace", filter, limit });
    exit(res, res.ok && res.data ? String(res.data) : "");
  }
  const res = await send("vite-module-graph", { mode: "snapshot", filter, limit });
  exit(res, res.ok && res.data ? String(res.data) : "");
}

if (cmd === "errors") {
  const mapped = args.includes("--mapped");
  const inlineSource = args.includes("--inline-source");
  const res = await send("errors", { mapped, inlineSource });
  exit(res, res.ok && res.data ? String(res.data) : "no errors");
}

if (cmd === "logs") {
  const res = await send("logs");
  exit(res, res.ok && res.data ? String(res.data) : "");
}

if (cmd === "screenshot") {
  const res = await send("screenshot");
  exit(res, res.ok && res.data ? String(res.data) : "");
}

if (cmd === "eval") {
  if (!arg) {
    console.error("usage: vite-browser eval <script>");
    process.exit(1);
  }
  const res = await send("eval", { script: arg });
  exit(res, res.ok && res.data ? String(res.data) : "");
}

if (cmd === "network") {
  const idx = arg ? parseInt(arg, 10) : undefined;
  const res = await send("network", { idx });
  exit(res, res.ok && res.data ? String(res.data) : "");
}

console.error(`unknown command: ${cmd}`);
process.exit(1);

function exit(res: { ok: boolean; error?: string }, msg: string) {
  if (!res.ok) {
    console.error(res.error || "error");
    process.exit(1);
  }
  if (msg) console.log(msg);
  process.exit(0);
}

function printUsage() {
  console.log(`
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
  logs                                Show dev server logs

UTILITIES
  screenshot                          Save screenshot to temp file
  eval <script>                       Evaluate JavaScript in page context
  network [idx]                       List network requests or inspect one

OPTIONS
  -h, --help                          Show this help message
`);
}

function normalizeUrl(value: string): string {
  if (value.includes("://")) return value;
  return `http://${value}`;
}
