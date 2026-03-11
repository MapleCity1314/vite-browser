# Signals and Confidence

## Signal Types

`vite-browser` combines several classes of runtime evidence:

- HMR timeline data
- module graph snapshots and traces
- current browser/runtime errors
- framework component inspection
- store-side changes and changed keys
- logs, network entries, and page-side eval results

These do not all have the same weight. Current errors and recent HMR updates are often the strongest anchor points. Render-path or store-path clues are valuable, but usually more timing-sensitive.

## Reading Correlation Output

### `correlate errors`

Use this when the current question is:

```text
Which recent update most likely matches the error I see right now?
```

This command is strongest when:

- the repro happened recently
- the current stack is still visible
- the module update window is narrow

### `correlate renders`

Use this when the current question is:

```text
Did a recent state or module change plausibly flow into this rerender path?
```

This output should be read as narrowing evidence, not a strict replay of framework internals.

### `diagnose propagation`

Use this when you want a rule-based summary across the available store, render, and error evidence.

It is designed to stay conservative when the evidence chain is incomplete.

## Confidence Guidance

### High confidence

Treat this as a strong debugging lead. It still is not mathematical proof, but it is usually enough to prioritize the next file or repro step.

### Medium or plausible

Treat this as directional. It is often enough to narrow a suspect set, but not enough to claim the root cause.

### Weak or absent evidence

Treat this as a sign to gather a fresher repro, reduce the event window, or inspect adjacent signals like logs or network state.

## Best Practices

- start with `errors --mapped --inline-source` when source context matters
- use short windows like `5000` ms for live repro loops
- re-run commands after reload or navigation so the runtime view stays current
- let the strongest signal drive the next step instead of running every command every time
