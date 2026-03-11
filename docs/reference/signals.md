# Signals & Confidence

How to read `vite-browser` diagnostic output.

## Signal types

`vite-browser` combines several classes of runtime evidence:

| Signal | Example commands | Weight |
|---|---|---|
| Current errors | `errors --mapped` | Strong anchor |
| Recent HMR updates | `vite hmr trace` | Strong when fresh |
| Module graph changes | `vite module-graph trace` | Good for dependency issues |
| Framework state | `vue tree`, `react tree` | Good for state bugs |
| Store changes | `vue pinia` | Timing-sensitive |
| Logs & network | `logs`, `network` | Supporting evidence |

Current errors and recent HMR updates are usually the strongest anchor points. Render-path and store-path clues are valuable but more timing-sensitive.

## Reading correlation output

### `correlate errors`

Answers: _Which recent update most likely matches the error I see right now?_

Strongest when:
- The repro just happened
- The current error stack is still visible
- The module update window is narrow

### `correlate renders`

Answers: _Did a recent state or module change plausibly flow into this render path?_

Read as narrowing evidence, not a strict replay of framework internals.

### `diagnose propagation`

Provides a rule-based summary across available store, render, and error evidence.

Designed to stay conservative when the evidence chain is incomplete.

## Confidence levels

### High confidence

A strong debugging lead. Not mathematical proof, but usually enough to prioritize the next file or repro step.

### Medium / plausible

Directional — enough to narrow a suspect set, not enough to claim root cause.

### Weak or absent

Gather a fresher repro, reduce the event window, or inspect adjacent signals like logs or network state.

## Best practices

- Start with `errors --mapped --inline-source` when source context matters
- Use short windows (`5000` ms) for live repro loops
- Re-run commands after reload or navigation to keep the view current
- Let the strongest signal drive the next step
