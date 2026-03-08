---
name: vite-browser-runtime-diagnostics
description: >-
  Deep Vite runtime diagnostics for HMR instability, unexpected full reloads,
  module churn, and stack trace mapping. Use this whenever users mention HMR
  issues, refresh loops, hot-update regressions, or "can't locate source from
  Vite error".
---

# vite-browser-runtime-diagnostics

Use this skill when standard component inspection is not enough and runtime
behavior is the likely cause.

## Primary checks

```bash
vite-browser vite runtime
vite-browser vite hmr
vite-browser vite hmr trace --limit 50
vite-browser vite module-graph --limit 200
vite-browser vite module-graph trace --limit 200
vite-browser errors --mapped --inline-source
```

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

### Stack mapping

1. `errors --mapped`
2. If mapping is still ambiguous, run `errors --mapped --inline-source`.
3. Use mapped file:line as the fix entrypoint.

## Output format

Always provide:

1. Runtime state summary (`vite runtime`)
2. HMR timeline conclusion
3. Module-graph delta conclusion
4. Final mapped source location(s)
5. Suggested fix order

