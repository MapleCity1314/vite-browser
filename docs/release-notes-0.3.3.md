# vite-browser v0.3.3

`v0.3.3` is a stabilization patch for the `v0.3` release line.

It hardens the real-world Vite 7 / Vue / Pinia debugging path where a hot-updated store breaks a downstream render and the CLI needs to recover the `source -> store -> render -> error` story from sparse runtime evidence.

## What changed

- standardized tracked HMR fallback usage in the daemon so error and render correlation can reuse console-derived HMR updates
- upgraded error correlation to keep high-confidence source-module output even when the current error lands in a downstream component file
- preserved `changedKeys` and source-module hints more reliably when store-side and render-side evidence arrive unevenly
- cleared stale runtime errors after successful navigation or reload so `errors` reflects the current page lifecycle instead of the last failure forever
- expanded regression coverage across unit tests, evals, real e2e, and repeated browser session loops
- kept the stronger `demo-gif` repro as a local-only validation path rather than making it a required in-repo fixture

## Why this matters

Before `v0.3.3`, a realistic Vue/Pinia HMR repro could expose the correct updated store module through tracked HMR logs, yet still downgrade to weaker correlation output because the page-side collector missed the browser HMR event or the current error stack only mentioned the broken component.

This patch improves the practical reliability of:

- `vite-browser correlate errors --mapped --window 5000`
- `vite-browser correlate renders --window 5000`
- `vite-browser diagnose propagation --window 5000`
- `vite-browser errors`

in the kinds of short live repro loops developers actually run.

## Validation

The release candidate was verified with:

- `pnpm build`
- `pnpm test`
- focused eval suites for correlation and propagation output
- real e2e against the tracked demo app
- local optional e2e against the stronger `demo-gif` repro, including recovery and repeated `close/open/errors` loops

## Scope

`v0.3.3` does not change the `v0.3` product model.

Propagation output remains a high-confidence narrowing aid, not a claim of complete deep causal proof across arbitrary component graphs. The patch-level gain is that the live evidence chain is more stable and easier to trust when Vite/browser/runtime signals arrive imperfectly.
