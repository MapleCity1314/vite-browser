# AI IDE Setup

This page documents the recommended `vite-browser` setup for common coding-agent environments.

## Claude Code

`vite-browser` has a direct packaged-skill install path:

```bash
npx skills add MapleCity1314/vite-browser
```

Then add a short repo-level reminder in `CLAUDE.md`:

```md
## vite-browser

When the task is about debugging a Vite app, recent HMR breakage, runtime errors
after a hot update, wrong UI data, or release smoke validation, use the installed
`vite-browser` skill router before inventing a generic debugging flow.

Start from the router skill and follow the routed pack.
```

You can also reuse the example file:

- [examples/ai-ide/CLAUDE.md](https://github.com/MapleCity1314/vite-browser/blob/master/examples/ai-ide/CLAUDE.md)

## Codex

Inference from current OpenAI Codex docs: the portable repo-native path is to keep agent instructions in `AGENTS.md`, and for reusable workflows to check the skill material into the repository rather than depending on a Claude-specific installer.

Recommended layout in your target repo:

```text
AGENTS.md
skills/
  SKILL.md
  vite-browser-core-debug/
  vite-browser-runtime-diagnostics/
  vite-browser-network-regression/
  vite-browser-release-smoke/
```

Add this to `AGENTS.md`:

```md
## vite-browser

When the task is about debugging a Vite app, runtime behavior after a recent edit,
HMR or reload regressions, wrong data from the UI, or release smoke checks, use
the checked-in `vite-browser` skills in `skills/`.

Routing:
- Start with `skills/SKILL.md`
- Use `vite-browser-runtime-diagnostics` for HMR, reload, module, or import failures
- Use `vite-browser-network-regression` for request, auth, CORS, or payload issues
- Use `vite-browser-release-smoke` for pre-merge or pre-release checks
- Use `vite-browser-core-debug` only for broad first-pass triage
```

You can reuse the example file:

- [examples/ai-ide/AGENTS.codex.md](https://github.com/MapleCity1314/vite-browser/blob/master/examples/ai-ide/AGENTS.codex.md)

## Cursor

Inference from current Cursor docs: Cursor supports `AGENTS.md` and also project rules in `.cursor/rules`. For `vite-browser`, the simplest portable setup is the same checked-in `skills/` folder plus one lightweight routing rule.

If you already use `AGENTS.md`, you can reuse the Codex-style snippet. If your team prefers Cursor rules, add:

```mdc
---
description: Route Vite debugging tasks into vite-browser skill packs.
globs:
alwaysApply: false
---

When the task is about debugging a Vite app, recent hot-update breakage, runtime
errors after a save, wrong UI data, auth failures, or release smoke validation,
consult the repository's `skills/` directory and start with `skills/SKILL.md`.

Routing:
- `vite-browser-runtime-diagnostics` for HMR, reload, module, import, or websocket issues
- `vite-browser-network-regression` for API, payload, auth, cookie, or CORS issues
- `vite-browser-release-smoke` for final validation
- `vite-browser-core-debug` for broad first-pass diagnosis
```

Example file:

- [examples/ai-ide/cursor-vite-browser.mdc](https://github.com/MapleCity1314/vite-browser/blob/master/examples/ai-ide/cursor-vite-browser.mdc)

## Practical Recommendation

- Claude Code: use the packaged install command.
- Codex: check in `skills/` and route via `AGENTS.md`.
- Cursor: check in `skills/` and route via `AGENTS.md` or `.cursor/rules`.

That gives you one portable skill layout and only one tool-specific layer of configuration.
