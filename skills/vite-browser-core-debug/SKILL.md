---
name: vite-browser-core-debug
description: >-
  Core troubleshooting workflow for Vue/React/Svelte Vite apps using
  vite-browser. Use this whenever users ask to debug UI behavior, inspect
  component state, verify router/store values, or investigate "page is broken"
  issues in local Vite dev servers.
---

# vite-browser-core-debug

Use this skill for first-pass diagnosis of running Vite apps.

## Workflow

1. Open app and detect framework.
2. Run error-first gate (`errors`, `logs`).
3. Inspect framework state (`vue/react/svelte tree`, plus router/pinia for Vue).
4. Validate behavior with `network`, `screenshot`, and `eval`.
5. Return findings with command evidence and a minimal fix path.

## Command sequence

```bash
vite-browser open <url>
vite-browser detect
vite-browser errors
vite-browser logs
```

Then branch:

- Vue:
  - `vite-browser vue tree`
  - `vite-browser vue tree <id>`
  - `vite-browser vue pinia [store]`
  - `vite-browser vue router`
- React:
  - `vite-browser react tree`
  - `vite-browser react tree <id>`
- Svelte:
  - `vite-browser svelte tree`
  - `vite-browser svelte tree <id>`

Cross-check:

```bash
vite-browser network
vite-browser screenshot
vite-browser eval '<script>'
```

## Output format

Always report:

1. Confirmed symptom
2. Evidence (exact command + key output)
3. Root-cause hypothesis
4. Minimal fix
5. Recheck commands

