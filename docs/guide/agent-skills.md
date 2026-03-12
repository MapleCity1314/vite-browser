# Agent Skills

## What are Agent Skills?

Agent Skills are packaged debugging workflows that AI coding tools (Claude Code, Codex, Cursor) can follow automatically. Instead of the agent inventing an ad-hoc debugging sequence every time, a skill encodes the right steps, the right order, and the right routing logic.

`vite-browser` is designed skill-first — the CLI provides the raw commands, but the skill router provides the intelligence layer that decides _which_ commands to run and _when_.

## Why it matters

Without a skill router, an AI agent debugging a broken Vite app will typically:

- Run too many commands too early
- Mix network and runtime evidence together
- Over-explain weak evidence
- Skip the first routing decision entirely

The skill router solves this by encoding a single decision tree:

| Symptom | Route to |
|---|---|
| Broad or unclear failure | `core-debug` |
| Recent edit or HMR breakage | `runtime-diagnostics` |
| Wrong data or failed requests | `network-regression` |
| Pre-merge/release verification | `release-smoke` |

## Install

```bash
# Claude Code
npx skills add MapleCity1314/vite-browser
```

This installs the router skill plus four focused capability packs:

```
skills/SKILL.md                              ← router
skills/vite-browser-core-debug/SKILL.md
skills/vite-browser-runtime-diagnostics/SKILL.md
skills/vite-browser-network-regression/SKILL.md
skills/vite-browser-release-smoke/SKILL.md
```

## How the agent uses it

When a user says something like:

- _"The page broke after a hot update"_
- _"Which recent change caused this error?"_
- _"The UI is showing wrong data"_
- _"Run a smoke check before we merge"_

the agent reads the router skill, picks the matching pack, and follows its structured workflow — instead of guessing.

## When to use the CLI directly

The CLI is the lower-level interface. Use it directly when:

- You want to manually inspect a single signal
- You are validating one specific command
- Your environment does not support packaged skills

For everything else, start from the skill router.

## React-specific routing (v0.3.5+)

When the failing app is a React application, the same four-pack routing applies. After landing in the right pack, React-specific commands are available:

```bash
vite-browser react store list          # discover Zustand stores
vite-browser react store inspect <n>   # inspect store state
vite-browser react renders             # render events with phase and duration
```

No configuration is required. The React DevTools hook is bundled and injected automatically.

## Next steps

- [AI IDE Setup](/guide/ide-setup) — Configure Claude Code, Codex, or Cursor
- [Skill Packs](/reference/skill-packs) — Detailed pack reference
