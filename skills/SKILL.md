---
name: vite-browser
description: >-
  Skill router for vite-browser capability packs. Use this whenever users ask
  to debug Vite apps, and then delegate to the most specific skill:
  core-debug, runtime-diagnostics, network-regression, or release-smoke.
---

# vite-browser

This is the entry skill that routes to focused skills by scenario.

## Skill routing

1. General app bug, component/state confusion:
   - `skills/vite-browser-core-debug/SKILL.md`
2. HMR/reload loops, runtime instability, stack mapping:
   - `skills/vite-browser-runtime-diagnostics/SKILL.md`
3. API/data mismatch, request failures:
   - `skills/vite-browser-network-regression/SKILL.md`
4. Pre-merge/pre-release final verification:
   - `skills/vite-browser-release-smoke/SKILL.md`

If multiple conditions apply, run in this order:

1. `core-debug`
2. `runtime-diagnostics`
3. `network-regression`
4. `release-smoke`

---

## Shared bootstrap for all routed skills

```bash
vite-browser open <url>
vite-browser detect
vite-browser errors
vite-browser logs
```

Then continue with the selected specialized skill.

---

## Command groups (current CLI)

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

### Runtime

```bash
vite-browser vite runtime
vite-browser vite hmr
vite-browser vite hmr trace --limit <n>
vite-browser vite hmr clear
vite-browser vite module-graph [--filter <txt>] [--limit <n>]
vite-browser vite module-graph trace [--filter <txt>] [--limit <n>]
vite-browser vite module-graph clear
vite-browser errors --mapped --inline-source
```

### Utilities

```bash
vite-browser network [idx]
vite-browser screenshot
vite-browser eval <script>
```

Install CLI:

```bash
npm install -g @presto1314w/vite-devtools-browser
npx playwright install chromium
```

Install skill:

```bash
npx skills add MapleCity1314/vite-browser
```
