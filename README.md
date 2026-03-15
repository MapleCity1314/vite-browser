# vite-browser

**Know why your Vite app broke — not just where.**

Runtime diagnostics CLI for Vite applications. Connect to a running dev server, correlate errors with recent HMR activity, trace store-to-render propagation paths, and inspect framework state — all from the terminal, with zero project setup.

Built for developers and AI coding agents alike.

📖 [Documentation](https://maplecity1314.github.io/vite-browser/) · 📦 [npm](https://www.npmjs.com/package/@presto1314w/vite-devtools-browser)

<p align="center">
  <img src="assets/demo.gif" alt="vite-browser demo" width="720" />
</p>

## Install

**Agent Skill** (recommended):

```bash
npx skills add MapleCity1314/vite-browser
```

**CLI only:**

```bash
npm install -g @presto1314w/vite-devtools-browser
npx playwright install chromium
```

## The problem

You save a file. Vite hot-updates. The page breaks.

The error overlay tells you _what_ failed — but not _which update caused it_, how the change propagated through your component tree, or whether the real problem is a stale store, a broken import, or a network regression.

## What vite-browser does

```bash
# 1. See the current error with source context
$ vite-browser errors --mapped --inline-source

TypeError: Cannot read properties of undefined (reading 'items')
  → /src/components/CartSummary.tsx:14:12
    14 | total = cart.items.reduce(...)

# 2. Correlate with recent HMR activity
$ vite-browser correlate errors --mapped --window 5000

Confidence: high
HMR update observed within 5000ms of the current error
Matching modules: /src/store/cart.ts

# 3. Trace the propagation path
$ vite-browser diagnose propagation --window 5000

Status: fail | Confidence: high
Store → Render → Error path found:
  store: cart (changedKeys: items)
  render: AppShell > ShoppingCart > CartSummary
```

Four commands. You know the store update broke the render path. You know where to fix it.

## Key features

- **Error correlation** — Match errors against recent HMR-updated modules within a time window
- **Propagation diagnosis** — Trace `store → render → error` paths with confidence levels
- **HMR diagnosis** — Detect patterns like `missing-module`, `circular-dependency`, `hmr-websocket-closed`
- **Framework inspection** — Vue trees, Pinia stores, Vue Router, React props/hooks/state, Svelte trees
- **Mapped errors** — Source-mapped stack traces with inline source snippets
- **Zero config** — No plugins, no project changes. Works with any running Vite dev server

## Agent Skills

`vite-browser` is designed skill-first. The skill router automatically picks the right debugging workflow based on the symptom:

| Symptom | Routed to |
|---|---|
| Broad / unclear failure | `core-debug` |
| Recent edit or HMR breakage | `runtime-diagnostics` |
| Wrong data or failed requests | `network-regression` |
| Pre-merge verification | `release-smoke` |

AI coding agents (Claude Code, Codex, Cursor) follow the structured workflow instead of guessing.

→ [Agent Skills guide](https://maplecity1314.github.io/vite-browser/guide/agent-skills) · [AI IDE Setup](https://maplecity1314.github.io/vite-browser/guide/ide-setup)

## Quick reference

```bash
# Browser
vite-browser open <url>          # Launch and navigate
vite-browser close               # Close browser and daemon

# Diagnostics
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window <ms>
vite-browser correlate renders --window <ms>
vite-browser diagnose hmr --limit <n>
vite-browser diagnose propagation --window <ms>

# Framework
vite-browser detect
vite-browser vue tree | vue pinia | vue router
vite-browser react tree
vite-browser svelte tree

# Vite runtime
vite-browser vite runtime
vite-browser vite hmr trace --limit <n>
vite-browser vite module-graph trace --limit <n>

# Utilities
vite-browser logs | network | screenshot | eval <script>
```

→ [Full CLI reference](https://maplecity1314.github.io/vite-browser/reference/cli)

## Current scope

`v0.3.3` is reliable at surfacing runtime state, correlating errors with HMR activity, detecting common HMR failure patterns, and narrowing `store → render → error` paths in Vue + Pinia workflows.

`correlate renders` and `diagnose propagation` are **high-confidence narrowing tools**, not strict causal proof. They intentionally produce conservative output when evidence is incomplete.

React store inspection (Zustand, Redux) and deeper cross-framework propagation tracing are on the roadmap.

## Development

```bash
pnpm install
pnpm build
pnpm test
```

**Requirements:** Node.js ≥ 20 · Chromium via Playwright · Running Vite dev server

## License

MIT
