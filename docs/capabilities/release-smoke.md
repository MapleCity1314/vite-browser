# Release Smoke

## When to use

Use `release-smoke` for **final verification before merge or release**. This is a structured go/no-go pass — not a root-cause workflow.

## What it checks

- Does the app boot cleanly?
- Do key paths load without errors?
- Is the runtime state healthy?
- Are there critical network failures?
- Does one edit cycle reveal obvious blockers?

## Sequence

**Baseline checks:**

```bash
vite-browser open <url>
vite-browser detect
vite-browser errors --mapped --inline-source
vite-browser logs
vite-browser network
vite-browser vite runtime
vite-browser screenshot
```

**Runtime sanity:**

```bash
vite-browser correlate errors --mapped --window 5000
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 20
vite-browser vite module-graph trace --limit 50
```

**Recovery sanity:**

```bash
vite-browser reload
vite-browser errors
```

## Expected output

1. `PASS` or `FAIL` for each check item
2. Blocking issues list
3. Diagnosis hits and confidence
4. Evidence commands
5. Final recommendation: **go** or **no-go**
