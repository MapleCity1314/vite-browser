# Agent Skills

## Why The Docs Now Start Here

The recommended way to use `vite-browser` is no longer "memorize the CLI and type commands by hand."

The primary product model is:

1. install the `vite-browser` skill router
2. let the agent route into the right pack
3. fall back to raw CLI only when you need manual control

That is a better fit for real coding-agent workflows because the router encodes the first decision:

- broad app failure -> `core-debug`
- recent edit or HMR breakage -> `runtime-diagnostics`
- bad request or wrong data -> `network-regression`
- final verification -> `release-smoke`

## Install The Skill Router

For tools that support packaged skill installation directly:

```bash
npx skills add MapleCity1314/vite-browser
```

That installs the router skill plus the pack layout it expects.

## What Gets Installed

The router lives at:

```text
skills/SKILL.md
```

It routes into four focused packs:

```text
skills/vite-browser-core-debug/SKILL.md
skills/vite-browser-runtime-diagnostics/SKILL.md
skills/vite-browser-network-regression/SKILL.md
skills/vite-browser-release-smoke/SKILL.md
```

## Recommended Agent Flow

When a user says:

- "the page broke after a hot update"
- "which recent update caused this"
- "the UI is showing wrong data"
- "do a release smoke pass before merge"

the agent should start from the router skill and follow the routed pack instead of inventing an ad-hoc debugging sequence.

## When To Use The Raw CLI Directly

The CLI still matters, but it is now the lower-level interface.

Use it directly when:

- you want to manually inspect one specific signal
- you are validating a single command outside an agent loop
- your environment does not support packaged skills and you need the plain terminal workflow first

Next: [AI IDE Setup](/guide/ide-setup)
