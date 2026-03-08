# vite-browser

`vite-browser` is a debugging toolchain for Vite apps:
- Agent Skill: scenario-based debugging workflows for coding assistants
- CLI Runtime (`@presto1314w/vite-devtools-browser`): structured inspection of Vue/React/Svelte runtime state

Current documented baseline: `v0.1.4`.

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
vite-browser vue tree
vite-browser vue pinia
vite-browser vite runtime
vite-browser vite hmr trace --limit 20
vite-browser vite module-graph trace --limit 50
vite-browser errors --mapped --inline-source
vite-browser network
vite-browser close
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
  - source-mapped errors with optional inline source snippet
- Debug utilities: console logs, network tracing, screenshot, page `eval`

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

## Requirements

- Node.js `>=20`
- Chromium installed via Playwright
- Running Vite dev server

## License

MIT
