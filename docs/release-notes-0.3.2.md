# vite-browser v0.3.2

`v0.3.2` is a stabilization patch for the `v0.3` release line.

It improves live propagation diagnosis in real Vite repros by making store-driven Vue failures surface more consistently through `correlate renders` and `diagnose propagation`, while keeping the conservative `v0.3` product positioning.

## What changed

- improved live Pinia/store propagation capture for Vue repros
- added action-driven fallback evidence when direct store mutation events are incomplete
- promoted single-store render hints into usable propagation evidence when the event window is otherwise sparse
- allowed propagation diagnosis to reuse the current runtime error when the queue lacks a separate error event

## Why this matters

Before `v0.3.2`, some live repros could capture the render path and current error but still fall back to weak propagation output because the store-side signal arrived late or incompletely.

This patch makes the common Vue case much more practical:

- `correlate renders --window 5000`
- `diagnose propagation --window 5000`

are now more likely to return a useful `store -> render -> error` conclusion from one short live repro loop.

## Scope

`v0.3.2` does not change the `v0.3` product model.

It is still correct to position propagation output as high-confidence narrowing with conservative fallback behavior when evidence is incomplete. The patch-level improvement is that live Vue/Pinia repros now produce actionable propagation output more reliably.
