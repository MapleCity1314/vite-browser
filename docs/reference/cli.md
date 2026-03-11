# CLI Reference

## Browser

```bash
vite-browser open <url> [--cookies-json <file>]
vite-browser close
vite-browser goto <url>
vite-browser back
vite-browser reload
```

## Framework

```bash
vite-browser detect
vite-browser vue tree [id]
vite-browser vue pinia [store]
vite-browser vue router
vite-browser react tree [id]
vite-browser svelte tree [id]
```

## Vite Runtime

```bash
vite-browser vite restart
vite-browser vite runtime
vite-browser vite hmr
vite-browser vite hmr trace [--limit <n>]
vite-browser vite hmr clear
vite-browser vite module-graph [--filter <txt>] [--limit <n>]
vite-browser vite module-graph trace [--filter <txt>] [--limit <n>]
vite-browser vite module-graph clear
vite-browser errors
vite-browser errors --mapped
vite-browser errors --mapped --inline-source
vite-browser correlate errors [--window <ms>]
vite-browser correlate renders [--window <ms>]
vite-browser diagnose hmr [--window <ms>] [--limit <n>]
vite-browser diagnose propagation [--window <ms>]
```

## Utilities

```bash
vite-browser logs
vite-browser network [idx]
vite-browser screenshot
vite-browser eval <script>
```

## Common Workflows

### Fast runtime triage

```bash
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

### Propagation triage

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser vue pinia
vite-browser vue tree
```

### Network or state debugging

```bash
vite-browser logs
vite-browser network
vite-browser eval '<state probe>'
```

## Output Expectations

- `errors --mapped --inline-source` is the best entry point when you need source context.
- `correlate errors` compares current failures against recent HMR and runtime evidence within a time window.
- `diagnose propagation` is conservative by design. It reports plausible `store -> render -> error` paths only when the evidence is strong enough.
