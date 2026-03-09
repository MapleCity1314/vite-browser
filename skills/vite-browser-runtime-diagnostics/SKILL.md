---
name: vite-browser-runtime-diagnostics
description: >-
  Deep Vite runtime diagnostics for recent hot-update regressions, HMR
  instability, unexpected full reloads, module churn, stack trace mapping, and
  "which recent update caused this" analysis. Use this whenever users mention
  HMR issues, refresh loops, full reloads, recent edit broke page, or "can't
  locate source from Vite error".
---

# vite-browser-runtime-diagnostics

Use this skill when runtime behavior is the likely cause. Prefer it over component inspection when timing and recent updates matter.

## Standard sequence

```bash
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 50
vite-browser vite module-graph --limit 200
vite-browser vite module-graph trace --limit 200
```

Use `diagnose hmr` as the default triage command after collecting mapped errors.

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
5. HMR timeline conclusion
6. Module-graph delta conclusion
7. Final mapped source location(s)
8. Suggested fix order
