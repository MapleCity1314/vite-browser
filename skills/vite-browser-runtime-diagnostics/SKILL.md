---
name: vite-browser-runtime-diagnostics
description: >-
  Deep Vite runtime diagnostics for recent hot-update regressions, HMR
  instability, unexpected full reloads, module churn, stack trace mapping, and
  "which recent update caused this" analysis. Make sure to use this skill
  whenever users mention any of: HMR, hot reload, hot update, full reload, page
  refresh, unexpected refresh, recent edit broke page, recent change broke it,
  it was working before, module errors, import failures, import resolution,
  failed to resolve, cannot find module, circular dependency, websocket closed,
  Vite error overlay, can't locate source from Vite error, rerender loop,
  component path, store update caused error, Pinia mutation, or "which component
  rerendered after this update".
---

# vite-browser-runtime-diagnostics

Use this skill when runtime behavior is the likely cause. Prefer it over component inspection when timing and recent updates matter.

## Standard sequence

```bash
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 50
vite-browser vite module-graph --limit 200
vite-browser vite module-graph trace --limit 200
```

Use `diagnose propagation` first when the question is about rerenders, component paths, store changes, or "what update actually flowed into this failure". Use `diagnose hmr` first when the problem still looks primarily transport/HMR-layer.

## Diagnostic patterns

### HMR instability

1. `vite hmr clear`
2. Reproduce once
3. `vite hmr trace --limit 50`
4. Flag `full-reload` or repeated `error` events.

### Module churn

1. `vite module-graph clear`
2. Capture baseline: `vite module-graph`
3. Trigger one change or one navigation
4. `vite module-graph trace`
5. Inspect unexpectedly added/removed modules.

### Recent update caused failure

1. Reproduce once after the failure.
2. `correlate errors --mapped --window 5000`
3. Identify whether the current error overlaps with recent HMR-updated modules.
4. Inspect the highest-confidence matching module first.

### Store or component propagation

1. Reproduce once after the visible failure.
2. `correlate renders --window 5000`
3. `diagnose propagation --window 5000`
4. Use `Store Updates`, `Changed Keys`, and `Render Path` to choose the first store/component to inspect.

### Stack mapping

1. `errors --mapped`
2. If mapping is still ambiguous, run `errors --mapped --inline-source`.
3. Use mapped file:line as the fix entrypoint.

### Automated diagnosis

1. `diagnose hmr --limit 50`
2. Review rule hits for `missing-module`, `circular-dependency`, `hmr-websocket-closed`, and `repeated-full-reload`.
3. Use the highest-confidence `fail` item first.
4. Treat `warn` items as supporting evidence, not primary root cause.

## Output format

Always provide:

1. Runtime state summary (`vite runtime`)
2. Most likely runtime cause
3. Diagnosis hits with status and confidence
4. Error/HMR correlation conclusion
5. Render/component propagation conclusion
6. HMR timeline conclusion
7. Module-graph delta conclusion
8. Final mapped source location(s)
9. Suggested fix order

## When to switch skills

If diagnosis reveals the root cause is actually:
- Component state or framework-specific issue (wrong props, store state, router) → switch to `vite-browser-core-debug`
- Network/API issue (wrong data, failed requests, CORS, auth) → switch to `vite-browser-network-regression`
- Need final pre-release validation → switch to `vite-browser-release-smoke`
