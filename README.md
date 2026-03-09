# vite-browser

`vite-browser` is a runtime diagnostics toolchain for Vite applications.

It gives agents and developers structured access to:

- Vue, React, and Svelte runtime state
- Vite HMR activity and runtime health
- event-window correlation between current errors and recent hot updates
- rule-based HMR diagnosis with confidence levels
- module graph snapshots and diffs
- mapped error output with optional source snippets
- network, logs, screenshots, and page evaluation

It ships in two forms:

- Agent Skill: scenario-based debugging workflows for coding assistants
- CLI Runtime (`@presto1314w/vite-devtools-browser`): structured shell commands for local Vite debugging

Current documented baseline: `v0.2.2`.

## What's New In v0.2

`v0.2.x` moves `vite-browser` from snapshot-style inspection toward runtime diagnosis:

- browser/runtime events are captured into a daemon-side event queue
- `correlate errors` links the current error to recent HMR-updated modules
- `diagnose hmr` turns runtime, trace, and error signals into structured findings
- skills and CLI flows now route more directly to runtime triage instead of raw log inspection

`v0.2.2` is the stabilization pass for this model:

- tighter `diagnose hmr` wording around websocket evidence and runtime ambiguity
- better test coverage for the four built-in diagnosis families
- docs and release positioning aligned around the stable `v0.2.x` surface

## Built For Agents

`vite-browser` is designed for agent workflows as much as local debugging.

Models do not work well with a DevTools panel that has to be visually inspected step by step. They work much better when runtime signals are exposed as structured commands that can be queried, compared, and chained in a loop. `vite-browser` turns framework state, Vite runtime status, HMR activity, module graph changes, mapped errors, logs, and network activity into terminal output that an agent can actually reason about.

Under the hood, each command is a one-shot request against a long-lived browser daemon. That keeps the CLI simple for users while letting agent loops inspect a running app repeatedly without having to manage browser lifecycle on every step.

## Why vite-browser

Most browser CLIs are optimized for automation. Most framework devtools are optimized for humans in a GUI.

`vite-browser` is optimized for structured Vite runtime debugging:

- it can inspect framework state like a devtools bridge
- it can explain Vite-specific behavior like HMR updates and module graph changes
- it can correlate recent updates with current failures
- it returns structured text that AI agents can consume directly in loops

## Positioning

| Tool | Best for | Notable gap compared with `vite-browser` |
| --- | --- | --- |
| `agent-browser` | general browser automation | not focused on Vite runtime diagnostics |
| `next-browser` | Next.js + React debugging | not designed as a Vite runtime tool |
| `vite-plugin-vue-mcp` | Vue MCP integration inside Vite | plugin/MCP-first, not a standalone diagnostics CLI |
| `vite-browser` | Vite runtime diagnostics for agents and developers | browser lifecycle coverage still being expanded |

## Install

### Install Skill

```bash
npx skills add MapleCity1314/vite-browser
```

### Install CLI

```bash
npm install -g @presto1314w/vite-devtools-browser
npx playwright install chromium
```

## Quick Start

```bash
# terminal A: start Vite app
cd my-app
npm run dev

# terminal B: inspect runtime
vite-browser open http://localhost:5173
vite-browser detect
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 20
vite-browser vite module-graph trace --limit 50
vite-browser network
vite-browser close
```

For component/state debugging, then branch into framework-specific commands:

```bash
vite-browser vue tree
vite-browser vue pinia
vite-browser vue router
vite-browser react tree
vite-browser svelte tree
```

## What It Looks Like

```bash
$ vite-browser vite runtime
# Vite Runtime
URL: http://localhost:5173/
Framework: vue
Vite Client: loaded
HMR Socket: open
Error Overlay: none
Tracked HMR Events: 3

$ vite-browser vite hmr trace --limit 5
# HMR Trace
[12:34:10] connected [vite] connected.
[12:34:15] update /src/App.vue

$ vite-browser errors --mapped --inline-source
Failed to resolve import "./missing"

# Mapped Stack
- http://localhost:5173/src/main.ts:12:4 -> /src/main.ts:12:4
  12 | import "./missing"

$ vite-browser correlate errors --mapped --window 5000
# Error Correlation
## Current Error
TypeError: boom at /src/App.tsx:4:2

## Correlation
Confidence: high
HMR update observed within 5000ms of the current error
Matching modules: /src/App.tsx

$ vite-browser diagnose hmr --limit 50
# HMR Diagnosis
## missing-module
Status: fail
Confidence: high
A module import failed to resolve during HMR.
Suggestion: Verify the import path, file extension, alias configuration, and whether the module exists on disk.
```

## Core Capabilities

- Framework detection: Vue/React/Svelte best-effort detection and version hinting
- Vue runtime inspection: component tree/details, Pinia stores/getters, Vue Router state
- React runtime inspection: component tree/details (props/state/hooks/context/source)
- Svelte runtime inspection: component tree/details when metadata is available
- Vite runtime diagnostics:
  - runtime status summary
  - HMR summary/timeline/clear
  - module-graph snapshot/diff/clear
  - error/HMR correlation over recent event windows
  - rule-based HMR diagnosis with confidence levels
  - source-mapped errors with optional inline source snippet
- Debug utilities: console logs, network tracing, screenshot, page `eval`

## Recommended Workflows

### Runtime/HMR triage

```bash
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 50
vite-browser vite module-graph trace --limit 200
```

### Data/API triage

```bash
vite-browser errors --mapped
vite-browser logs
vite-browser network
vite-browser network <idx>
vite-browser eval '<state probe>'
```

### Component/state triage

```bash
vite-browser detect
vite-browser vue tree
vite-browser vue pinia
vite-browser vue router
vite-browser react tree
vite-browser svelte tree
```

## Current Boundaries

`vite-browser` v0.2.2 is strong at:

- surfacing runtime state as structured shell output
- linking current errors to recent HMR/module activity
- detecting several common HMR failure patterns quickly

It is not yet a full propagation-trace engine. In particular, it does not reliably infer deep chains like `store -> component A -> component B -> error` across arbitrary component graphs.

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
vite-browser correlate errors --mapped --inline-source
vite-browser diagnose hmr [--window <ms>] [--limit <n>]
```

### Utilities

```bash
vite-browser logs
vite-browser network [idx]
vite-browser screenshot
vite-browser eval <script>
```

## Skill Packs

The entry skill routes to specialized workflows:

- `skills/vite-browser-core-debug/SKILL.md`
- `skills/vite-browser-runtime-diagnostics/SKILL.md`
- `skills/vite-browser-network-regression/SKILL.md`
- `skills/vite-browser-release-smoke/SKILL.md`

Router definition: [skills/SKILL.md](./skills/SKILL.md)

## Local Development

```bash
pnpm install
pnpm build
pnpm test
pnpm test:coverage
pnpm test:evals
pnpm test:evals:e2e
```

## Discovery

If you want to introduce the project to new users, start with the launch kit in [docs/launch-kit.md](./docs/launch-kit.md).

## Requirements

- Node.js `>=20`
- Chromium installed via Playwright
- Running Vite dev server

## License

MIT
