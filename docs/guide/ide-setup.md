# AI IDE Setup

Set up `vite-browser` in your AI coding environment.

## Claude Code

Install the skill directly:

```bash
npx skills add MapleCity1314/vite-browser
```

Then add a short reminder to your `CLAUDE.md`:

```md
## vite-browser

When debugging a Vite app — HMR breakage, runtime errors after a hot update,
wrong UI data, or release smoke validation — use the installed `vite-browser`
skill router. Start from the router and follow the routed pack.
```

## Codex

Check the skills into your repo and route through `AGENTS.md`:

```
AGENTS.md
skills/
  SKILL.md
  vite-browser-core-debug/
  vite-browser-runtime-diagnostics/
  vite-browser-network-regression/
  vite-browser-release-smoke/
```

Add to `AGENTS.md`:

```md
## vite-browser

For Vite debugging tasks — runtime errors, HMR regressions, wrong UI data,
or release smoke — use the `vite-browser` skills in `skills/`.

Routing:
- Start with `skills/SKILL.md`
- `vite-browser-runtime-diagnostics` for HMR, reload, module, or import failures
- `vite-browser-network-regression` for request, auth, CORS, or payload issues
- `vite-browser-release-smoke` for pre-merge or pre-release checks
- `vite-browser-core-debug` for broad first-pass triage
```

## Cursor

Cursor supports both `AGENTS.md` and `.cursor/rules`. The simplest setup is the same checked-in `skills/` folder plus a routing rule.

If using `AGENTS.md`, reuse the Codex snippet above. If using Cursor Rules:

```mdc
---
description: Route Vite debugging tasks into vite-browser skill packs.
globs:
alwaysApply: false
---

For Vite debugging tasks — HMR breakage, runtime errors, wrong UI data,
auth failures, or release smoke — start with `skills/SKILL.md`.

Routing:
- `vite-browser-runtime-diagnostics` for HMR, reload, module, import, or websocket issues
- `vite-browser-network-regression` for API, payload, auth, cookie, or CORS issues
- `vite-browser-release-smoke` for final validation
- `vite-browser-core-debug` for broad first-pass diagnosis
```

## Summary

| Tool | Setup |
|---|---|
| Claude Code | `npx skills add` + `CLAUDE.md` hint |
| Codex | Check in `skills/` + `AGENTS.md` routing |
| Cursor | Check in `skills/` + `AGENTS.md` or `.cursor/rules` |

One skill layout. One routing surface. One terminal execution layer.
