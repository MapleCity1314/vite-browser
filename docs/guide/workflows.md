# Workflows

Debugging recipes for common Vite failure scenarios.

## HMR triage

**When:** A file save is followed by a broken screen, stale overlay, or incorrectly rerendered component.

```bash
vite-browser vite runtime
vite-browser vite hmr trace --limit 50
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

**What you're answering:**
- Did HMR fire cleanly?
- Which module changed most recently?
- Does the current error match that update window?

## Propagation triage

**When:** A store update or state mutation appears to have broken a downstream render path.

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser vue pinia
vite-browser vue tree
```

**Best for:** Vue + Pinia workflows where the bug pattern is `store change → rerender → broken component`.

## Network triage

**When:** The failure is wrong data, failed requests, or missing client state — not an HMR issue.

```bash
vite-browser errors --mapped
vite-browser logs
vite-browser network
vite-browser network 0
vite-browser eval '<state probe>'
```

**Tip:** If network failures only appear after a hot update or reload loop, switch to [Runtime Diagnostics](/capabilities/runtime-diagnostics) instead.

## Agent loop

**When:** An AI agent is driving the debugging session. Keep the loop short and output comparable:

```bash
vite-browser vite runtime
vite-browser errors --mapped
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

Expand into `correlate renders`, `network`, or framework-specific commands only when the previous step suggests it.

## Tips

- **Re-run after navigation.** Reload or navigate, then re-run `errors` to avoid stale state.
- **Start with short windows.** Use `--window 5000` for tight repros; widen only if needed.
- **Follow the strongest signal.** Don't run every command every time — let the most prominent evidence drive the next step.
