# vite-browser

**Explain why your Vite app broke after a hot update.**

`vite-browser` is a runtime diagnostics toolchain for Vite apps. It connects current errors to recent HMR activity, traces store and module updates into rerender paths, and returns structured terminal output that both developers and AI agents can reason about directly.

No plugin installation. No GUI. Just connect to a running Vite dev server and start querying.

**CLI**
```bash
npm install -g @presto1314w/vite-devtools-browser
npx playwright install chromium
```

**Agent Skill**
```bash
npx skills add MapleCity1314/vite-browser
```

---

## The Problem It Solves

You save a file. Vite hot-updates. The page breaks.

The error overlay tells you *what* broke. It does not tell you *why the update caused it*.

You want to know:
- which module change triggered this error
- whether a store update propagated into a broken render path
- what the HMR timeline looked like before the failure

`vite-browser` answers these questions from the terminal, without touching your project config.

---

## Quickstart

```bash
# terminal A — your app
cd my-app && npm run dev

# terminal B — diagnostics
vite-browser open http://localhost:5173
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser close
```

---

## Example: Tracing a Broken HMR Update

You edit `src/store/cart.ts`. The page breaks with `TypeError: cannot read properties of undefined`.

```bash
# 1. check what the error actually is
$ vite-browser errors --mapped --inline-source

TypeError: Cannot read properties of undefined (reading 'items')

# Mapped Stack
- /src/components/CartSummary.tsx:14:12
  14 | total = cart.items.reduce(...)
```

```bash
# 2. correlate with recent HMR activity
$ vite-browser correlate errors --mapped --window 5000

# Error Correlation
Confidence: high
HMR update observed within 5000ms of the current error
Matching modules: /src/store/cart.ts
```

```bash
# 3. trace how the update propagated
$ vite-browser correlate renders --window 5000

# Render Correlation
Confidence: high
Recent store update likely propagated through 1 render step(s).

## Store Updates
- cart

## Changed Keys
- items

## Render Path
- AppShell > ShoppingCart > CartSummary
```

```bash
# 4. get a structured diagnosis
$ vite-browser diagnose propagation --window 5000

# Propagation Diagnosis
Status: fail
Confidence: high
A plausible store -> render -> error propagation path was found.
```

Four commands. You know the store update broke the render path. You know where to fix it.

---

## Built For Agents

Models cannot visually inspect a DevTools panel. They work much better when runtime signals are structured commands that can be queried, compared, and chained in a loop.

`vite-browser` turns Vite runtime state, HMR activity, module graph changes, framework component trees, mapped errors, and network activity into terminal output an agent can consume directly.

Each command is a one-shot request against a long-lived browser daemon — no browser lifecycle management on every step, no GUI dependency, no project config changes required.

```bash
# an agent debugging loop looks like this
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser diagnose hmr --limit 50
```

Agent Skill workflows are also available for scenario-based debugging in coding assistants:

```bash
npx skills add MapleCity1314/vite-browser
```

---

## Core Capabilities

**Framework detection**
- Vue, React, Svelte best-effort detection with version hinting

**Vue runtime**
- component tree and details
- Pinia stores, getters, and changed keys
- Vue Router state

**React runtime**
- component tree with props, state, hooks, context, and source metadata

**Svelte runtime**
- component tree when metadata is available

**Vite runtime diagnostics**
- runtime status and HMR health
- HMR timeline, summary, and clear
- module graph snapshot, diff, trace, and clear
- error / HMR correlation over configurable time windows
- store and module update / render path correlation
- propagation diagnosis with store updates, changed keys, and render paths
- rule-based HMR diagnosis with confidence levels
- source-mapped errors with optional inline source snippets

**Debug utilities**
- console logs, network tracing, screenshot, page `eval`

---

## Positioning

| Tool | Best for | Gap vs `vite-browser` |
|---|---|---|
| `agent-browser` | general browser automation | no Vite runtime awareness |
| `next-browser` | Next.js + React debugging | not a Vite runtime tool |
| `vite-plugin-vue-mcp` | Vue MCP integration | requires plugin install, Vue only |
| `vite-browser` | Vite runtime diagnostics for agents and developers | browser lifecycle coverage still expanding |

`vite-browser` requires no changes to your project. It works against any running Vite dev server across Vue, React, and Svelte.

---

## Recommended Workflows

### HMR / runtime triage
```bash
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 50
vite-browser vite module-graph trace --limit 200
```

### Propagation / rerender triage
```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser vue pinia
vite-browser vue tree
```

### Data / API triage
```bash
vite-browser errors --mapped
vite-browser logs
vite-browser network
vite-browser network <idx>
vite-browser eval '<state probe>'
```

### Component / state triage
```bash
vite-browser detect
vite-browser vue tree
vite-browser vue pinia
vite-browser vue router
vite-browser react tree
vite-browser svelte tree
```

---

## Command Reference

### Browser
```bash
vite-browser open <url> [--cookies-json <file>]
vite-browser close
vite-browser goto <url>
vite-browser back
vite-browser reload
```

### Framework
```bash
vite-browser detect
vite-browser vue tree [id]
vite-browser vue pinia [store]
vite-browser vue router
vite-browser react tree [id]
vite-browser svelte tree [id]
```

### Vite Runtime
```bash
vite-browser vite restart
vite-browser vite runtime
vite-browser vite hmr
vite-browser vite hmr trace [--limit <n>]
vite-browser vite hmr clear
vite-browser vite module-graph [--filter <txt>] [--limit <n>]
vite-browser vite module-graph trace [--filter <txt>] [--limit <n>]
vite-browser vite module-graph clear
vite-browser errors
vite-browser errors --mapped
vite-browser errors --mapped --inline-source
vite-browser correlate errors [--window <ms>]
vite-browser correlate renders [--window <ms>]
vite-browser correlate errors --mapped --inline-source
vite-browser diagnose hmr [--window <ms>] [--limit <n>]
vite-browser diagnose propagation [--window <ms>]
```

### Utilities
```bash
vite-browser logs
vite-browser network [idx]
vite-browser screenshot
vite-browser eval <script>
```

---

## Current Boundaries

`v0.3.0` is strong at:
- surfacing runtime state as structured shell output
- linking current errors to recent HMR and module activity
- detecting common HMR failure patterns with confidence levels
- narrowing likely store/module → render paths in Vue-first flows

`correlate renders` and `diagnose propagation` are **high-confidence propagation clues**, not strict causal proof. They do not reliably trace deep chains like `store → component A → component B → error` across arbitrary graphs, and intentionally fall back to conservative output when evidence is incomplete.

React store inspection (Zustand, Redux) and deeper cross-framework propagation tracing are on the roadmap.

---

## Skill Packs

```
skills/vite-browser-core-debug/SKILL.md
skills/vite-browser-runtime-diagnostics/SKILL.md
skills/vite-browser-network-regression/SKILL.md
skills/vite-browser-release-smoke/SKILL.md
```

Router: [skills/SKILL.md](./skills/SKILL.md)

---

## Local Development

```bash
pnpm install
pnpm build
pnpm test
pnpm test:coverage
pnpm test:evals
pnpm test:evals:e2e
```

## Requirements

- Node.js `>=20`
- Chromium via Playwright
- Running Vite dev server

## License

MIT