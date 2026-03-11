# Release Smoke

## What This Capability Is For

Use `release-smoke` for final verification before merge or release.

This is not a root-cause workflow. It is a structured go/no-go pass.

## What Humans Should Expect

This capability checks whether the app boots, key paths load, runtime state is sane, network activity has no critical failures, and one edit cycle does not reveal obvious release blockers.

## Best Practices For AI

- Use this only for sign-off, not initial debugging.
- Treat browser runtime failures and sticky stale errors as blockers.
- When store-driven UI failures are in scope, run both correlation and propagation checks.
- Return a concrete `go` or `no-go`, not a vague summary.

## Command Template

```bash
vite-browser open <url>
vite-browser detect
vite-browser errors --mapped --inline-source
vite-browser logs
vite-browser network
vite-browser vite runtime
vite-browser screenshot
```

Runtime sanity:

```bash
vite-browser correlate errors --mapped --window 5000
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 20
vite-browser vite module-graph trace --limit 50
```

Recovery sanity:

```bash
vite-browser reload
vite-browser errors
```

## Expected Output

Return:

1. `PASS` or `FAIL` by check item
2. blocking issues list
3. diagnosis hits and confidence
4. evidence commands
5. final recommendation: `go` or `no-go`
