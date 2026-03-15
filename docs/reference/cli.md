# CLI Reference

Complete command reference for `vite-browser`.

## Browser

```bash
vite-browser open <url> [--cookies-json <file>]   # Launch browser and navigate
vite-browser close                                 # Close browser and daemon
vite-browser goto <url>                            # Navigate to URL
vite-browser back                                  # Go back
vite-browser reload                                # Reload page
```

## Framework

```bash
vite-browser detect                   # Auto-detect Vue/React/Svelte
vite-browser vue tree [id]            # Vue component tree
vite-browser vue pinia [store]        # Pinia store state
vite-browser vue router               # Vue Router state
vite-browser react tree [id]          # React component tree
vite-browser react store list         # List detected Zustand stores
vite-browser react store inspect <n>  # Show Zustand store state
vite-browser react hook health        # Show bundled React hook status
vite-browser react hook inject        # Inject bundled hook into page
vite-browser react commits [--limit <n>]  # Show recent React commit records
vite-browser react commits clear      # Clear recorded commit history
vite-browser svelte tree [id]         # Svelte component tree
```

## Vite Runtime

```bash
vite-browser vite restart                                    # Trigger full page reload
vite-browser vite runtime                                    # Runtime status summary
vite-browser vite hmr                                        # HMR summary
vite-browser vite hmr trace [--limit <n>]                    # HMR event timeline
vite-browser vite hmr clear                                  # Clear HMR history
vite-browser vite module-graph [--filter <txt>] [--limit <n>]       # Module graph snapshot
vite-browser vite module-graph trace [--filter <txt>] [--limit <n>] # Module graph trace
vite-browser vite module-graph clear                         # Clear module graph history
```

## Errors & Diagnosis

```bash
vite-browser errors                                          # Raw errors
vite-browser errors --mapped                                 # Source-mapped errors
vite-browser errors --mapped --inline-source                 # With inline source snippets
vite-browser correlate errors [--window <ms>]                # Error ↔ HMR correlation
vite-browser correlate renders [--window <ms>]               # Render ↔ state correlation
vite-browser diagnose hmr [--window <ms>] [--limit <n>]      # Rule-based HMR diagnosis
vite-browser diagnose propagation [--window <ms>]            # Store→render→error diagnosis
```

## Utilities

```bash
vite-browser logs                    # Console output
vite-browser network [idx]           # Network requests (detail by index)
vite-browser screenshot              # Capture page screenshot
vite-browser eval <script>           # Execute JavaScript in page context
```

## Quick recipes

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

### Network debugging

```bash
vite-browser logs
vite-browser network
vite-browser eval '<state probe>'
```

## Output notes

- `errors --mapped --inline-source` is the best starting point when source context matters.
- `correlate errors` compares current failures against recent HMR events within the specified window.
- `diagnose propagation` is conservative by design — it reports `store → render → error` paths only when evidence is strong enough.
