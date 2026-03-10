---
name: vite-browser-release-smoke
description: >-
  Pre-release smoke verification workflow for Vite apps with vite-browser. Use
  this whenever users ask for final checks before merge/release, including core
  path validation, runtime sanity, HMR diagnosis, and evidence-based sign-off.
---

# vite-browser-release-smoke

Use this skill to produce a consistent go/no-go smoke report.

## Scope

Validate:

1. App boots and framework detected
2. No blocking runtime/build errors
3. Core user paths load and navigate
4. Network has no critical failures
5. HMR/runtime sanity on one edit cycle
6. No obvious runtime/diagnosis hit before sign-off

## Command template

```bash
vite-browser open <url>
vite-browser detect
vite-browser errors --mapped --inline-source
vite-browser logs
vite-browser network
vite-browser vite runtime
vite-browser screenshot
```

For `v0.3.2+`, use `errors --mapped --inline-source` in smoke checks even when no Vite overlay is visible. Browser-side runtime failures should now be treated as release blockers if they surface there or in `logs`, and live Vue propagation regressions should be checked with `diagnose propagation` when store-driven UI failures are in scope.

If Vue app:

```bash
vite-browser vue tree
vite-browser vue pinia
vite-browser vue router
```

Runtime sanity:

```bash
vite-browser vite hmr clear
# reproduce one change
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
## wait briefly if the repro depends on a UI interaction
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 20
vite-browser vite module-graph clear
vite-browser vite module-graph
vite-browser vite module-graph trace --limit 50
```

## Report format

Return:

1. `PASS`/`FAIL` by check item
2. Blocking issues list (if any)
3. Diagnosis hits and confidence, if any
4. Evidence commands for each failed item
5. Final recommendation: `go` or `no-go`

## When to switch skills

If smoke test reveals specific issues requiring deeper investigation:
- Component state or framework-specific failures → switch to `vite-browser-core-debug`
- HMR/runtime failures (hot update issues, module errors) → switch to `vite-browser-runtime-diagnostics`
- Network/API failures (wrong data, failed requests) → switch to `vite-browser-network-regression`
