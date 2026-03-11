# Runtime Diagnostics

## When to use

Use `runtime-diagnostics` when the problem is tied to **timing and recent updates**:

- HMR instability after a file save
- An edit that broke the page
- Import or module resolution failure
- Unexpected full reload
- _"Which update caused this?"_
- Store-driven propagation clues

## Sequence

```bash
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 50
vite-browser vite module-graph trace --limit 200
```

## Entry patterns

### Recent update caused a failure

Start here when the error appeared right after a save:

```bash
vite-browser correlate errors --mapped --window 5000
```

### Store or render propagation

Start here when a store change seems to have broken a downstream component:

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
```

### HMR transport or reload instability

Start here when the issue is about the HMR connection itself:

```bash
vite-browser diagnose hmr --limit 50
vite-browser vite hmr trace --limit 50
```

## Confidence note

Propagation output (`correlate renders`, `diagnose propagation`) provides **high-confidence narrowing**, not strict causal proof. When the evidence chain is incomplete, output is intentionally conservative.

## Expected output

1. Runtime state summary
2. Most likely runtime cause
3. Diagnosis hits and confidence level
4. Error/HMR correlation conclusion
5. Render/propagation conclusion
6. Mapped source entrypoint
