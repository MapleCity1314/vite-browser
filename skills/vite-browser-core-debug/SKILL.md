---
name: vite-browser-core-debug
description: >-
  Core troubleshooting workflow for Vue/React/Svelte Vite apps using
  vite-browser. Use this for first-pass debugging when the user reports broken
  UI behavior, wrong component state, router/store confusion, or a vague
  "page is broken" symptom and the dominant failure mode is not yet known.
---

# vite-browser-core-debug

Use this skill for first-pass diagnosis only. Escalate quickly if the problem is actually runtime or network driven.

## Workflow

1. Open app and detect framework.
2. Run error-first gate (`errors`, `logs`).
3. Decide whether the dominant issue is framework state, runtime/HMR, or network.
4. Inspect framework state (`vue/react/svelte tree`, plus router/pinia for Vue) only if the issue still looks component-driven.
5. Validate behavior with `network`, `screenshot`, and `eval`.
6. Return findings with command evidence and a minimal fix path.

## Escalation rules

Escalate to `vite-browser-runtime-diagnostics` if any of these are true:

1. The issue appeared right after a code edit or hot update.
2. `errors` or `logs` mention Vite, HMR, reload, import resolution, or websocket instability.
3. The page refreshes unexpectedly or falls back to full reload.

Escalate to `vite-browser-network-regression` if:

1. The main symptom is wrong data, empty data, or request failure.
2. `network` shows suspicious 4xx/5xx/FAIL responses.

## Command sequence

```bash
vite-browser open <url>
vite-browser detect
vite-browser errors --mapped
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
2. Most likely failure class: `component-state`, `runtime-hmr`, or `network-data`
3. Evidence (exact command + key output)
4. Confidence: `high`, `medium`, or `low`
5. Minimal fix or next skill to run
6. Recheck commands
