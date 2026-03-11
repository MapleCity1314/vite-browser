# Skill Packs

Reference for the `vite-browser` skill routing system.

## Router

`skills/SKILL.md` is the top-level router. For agent-driven use, it should always be the first stop.

Its job: choose one focused pack early instead of running every workflow at once.

## Pack matrix

| Pack | When to use | First commands |
|---|---|---|
| `core-debug` | App is broken, failure mode still unclear | `errors`, `logs`, `vite runtime`, framework tree |
| `runtime-diagnostics` | Issue after an edit, hot update, reload, import failure, or runtime instability | `errors --mapped`, `correlate errors`, `diagnose hmr`, `diagnose propagation` |
| `network-regression` | Wrong/missing data, failed requests, auth/CORS issues | `network`, `logs`, `errors --mapped`, `eval` |
| `release-smoke` | Final verification before merge or release | `detect`, `errors`, `network`, `vite runtime`, smoke report |

## Routing policy

1. Start with `core-debug` only when the symptom is broad
2. Switch to `runtime-diagnostics` when timing and recent updates matter
3. Switch to `network-regression` when the main symptom is request or data mismatch
4. Use `release-smoke` only for final sign-off, not root-cause discovery

## Why the split exists

Without the router, agents tend to:

- Run too many commands too early
- Mix network and runtime evidence
- Over-explain weak evidence
- Skip the routing decision entirely

The pack split prevents this by encoding the first decision into the workflow.
