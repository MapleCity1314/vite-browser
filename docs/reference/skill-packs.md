# Skill Packs

## Router

`skills/SKILL.md` is the top-level router. It should be the first stop for agent-driven use.

Its job is to choose one focused pack early instead of running every workflow blindly.

## Pack Matrix

| Pack | Use when | First signals |
|---|---|---|
| `vite-browser-core-debug` | The app is broken, but the failure mode is still broad or unclear. | `errors`, `logs`, `vite runtime`, framework tree |
| `vite-browser-runtime-diagnostics` | The issue appeared after an edit, hot update, full reload, import failure, or runtime instability. | `errors --mapped --inline-source`, `correlate errors`, `diagnose hmr`, `diagnose propagation` |
| `vite-browser-network-regression` | The UI shows wrong or missing data, requests fail, or auth/CORS looks broken. | `network`, `logs`, `errors --mapped`, `eval` |
| `vite-browser-release-smoke` | You want final validation before merge or release. | `detect`, `errors`, `network`, `vite runtime`, smoke report |

## Router Policy

The intended routing policy is:

1. start with `core-debug` only when the symptom is broad
2. switch immediately to `runtime-diagnostics` when timing and recent updates matter
3. switch to `network-regression` when the main symptom is request or data mismatch
4. use `release-smoke` only for final verification, not root-cause discovery

## Why This Matters

Without the router, agents tend to:

- run too many commands too early
- mix network and runtime evidence together
- over-explain weak evidence
- skip the first routing decision entirely

The pack split exists to prevent that.
