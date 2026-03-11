# Concepts

## The debugging loop

`vite-browser` is built around a specific loop:

1. **Connect** to a running Vite app
2. **Inspect** current runtime state
3. **Compare** current failures against recent update activity
4. **Narrow** likely causes with evidence that can be queried again

This is different from general browser automation. Most debugging pain starts _after_ the browser already rendered something incorrect — `vite-browser` focuses on that moment.

## Evidence types

The tool combines signals that are normally scattered across different panels:

| Signal | Source | Typical strength |
|---|---|---|
| Current errors | Browser runtime | Strong anchor point |
| Recent HMR updates | Vite WebSocket | Strong when fresh |
| Module graph changes | Vite internals | Good for import/dependency issues |
| Framework component state | Vue/React/Svelte DevTools | Good for state-related bugs |
| Store updates & changed keys | Framework stores | Timing-sensitive |
| Console logs & network traces | Browser APIs | Supporting evidence |

All output is structured so repeated CLI calls can be compared across a live debugging session.

## Confidence levels

`vite-browser` uses intentional confidence language in its output:

- **High confidence** — The evidence chain is strong enough to act on. Prioritize this file or repro step.
- **Plausible** — Useful for narrowing the suspect set, but not enough to call proven.
- **Conservative output** — The tool preferred to say less rather than construct a weak explanation.

## What it does not claim

`correlate renders` and `diagnose propagation` are **narrowing tools**, not proof engines.

They do not guarantee reconstruction of deep chains like:

```
store update → component A → component B → async side effect → error
```

across arbitrary frameworks and timing conditions. When evidence is incomplete, the output is intentionally conservative.

## Why this works for AI agents

AI agents are weak at visual inspection but strong at repeated structured queries. `vite-browser` plays to this strength:

```bash
vite-browser errors --mapped --inline-source   # what's broken
vite-browser correlate errors --mapped          # what changed recently
vite-browser diagnose hmr --limit 50            # what pattern matches
```

Each command returns something concrete to compare — no screenshot parsing or DevTools navigation required.
