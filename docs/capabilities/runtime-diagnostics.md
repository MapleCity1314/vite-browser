# Runtime Diagnostics

## What This Capability Is For

Use `runtime-diagnostics` when timing and recent updates matter.

This is the pack for:

- HMR instability
- recent edit broke the page
- import or module resolution failures
- unexpected full reloads
- "which recent update caused this"
- store or rerender propagation clues

## What Humans Should Expect

This page is for the moment when the app was working, you changed something, and then the runtime story became unclear.

It is strongest at turning recent update activity into a usable debugging direction.

## Best Practices For AI

- Prefer this capability over component-tree inspection when the failure is tied to a recent update.
- Treat `errors --mapped --inline-source` as the first read for live failures.
- Use propagation output as high-confidence narrowing, not strict causal proof.
- Keep conclusions conservative when the evidence chain is incomplete.

## Standard Sequence

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

## Best Entry Patterns

### Recent update caused failure

```bash
vite-browser correlate errors --mapped --window 5000
```

### Store or rerender propagation

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
```

### HMR transport or reload instability

```bash
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 50
```

## Expected Output

Return:

1. runtime state summary
2. most likely runtime cause
3. diagnosis hits and confidence
4. error/HMR correlation conclusion
5. render/propagation conclusion
6. mapped source entrypoint
