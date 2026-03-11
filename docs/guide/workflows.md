# Workflows

## HMR Runtime Triage

Use this path when a file save is followed by a broken screen, stale overlay, or a component that rerendered incorrectly.

```bash
vite-browser vite runtime
vite-browser vite hmr trace --limit 50
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

What you are trying to answer:

- did HMR fire cleanly
- which module changed most recently
- whether the current error plausibly matches that update window

## Propagation Rerender Triage

Use this path when a store update or framework-side state mutation appears to have broken a downstream render path.

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser vue pinia
vite-browser vue tree
```

This is the strongest current path for Vue and Pinia repros where the bug feels like:

```text
changed store module -> rerender -> broken component
```

## Network And Runtime Triage

Use this path when the failure might come from API responses, browser-side exceptions, or missing client state.

```bash
vite-browser errors --mapped
vite-browser logs
vite-browser network
vite-browser network 0
vite-browser eval '<state probe>'
```

This path is useful when the HMR signal is a distraction and the real issue is a failing request or a bad runtime assumption.

## Agent Loop Pattern

For agent-driven debugging, keep the loop short and comparable:

```bash
vite-browser vite runtime
vite-browser errors --mapped
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

Then only expand into `correlate renders`, `network`, or framework-specific inspection if the previous step suggests it.

## Session Hygiene

- clear stale assumptions by re-running `errors` after reload or navigation
- prefer shorter time windows first when reproductions are tight
- avoid very long command chains before checking whether the current page state actually changed
