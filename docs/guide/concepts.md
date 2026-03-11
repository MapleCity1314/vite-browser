# Concepts

## Product Model

`vite-browser` is not a browser automation framework with a few Vite commands bolted on. It is a runtime diagnostics CLI built around a narrower loop:

1. connect to a running Vite app
2. inspect current runtime state
3. compare current failures against recent update activity
4. narrow likely causes with evidence that can be queried again

That distinction matters because most debugging pain starts after the browser already rendered something incorrect.

## What Counts As Evidence

The tool works by combining signals that are often disconnected in normal debugging:

- recent HMR activity
- module graph changes
- framework component state
- store updates and changed keys
- current runtime errors
- browser logs and network traces

The output is intentionally structured so repeated CLI calls can be compared across a live repro loop.

## Confidence Language

The documentation uses different confidence levels on purpose.

- `high confidence` means the runtime evidence chain is strong enough to present a likely explanation
- `plausible` means the signal is useful for narrowing the search space, but not strong enough to call proven
- `conservative output` means the tool preferred to say less rather than invent a story from weak evidence

## What It Does Not Claim

`correlate renders` and `diagnose propagation` should be read as narrowing tools, not as a proof engine.

They do not guarantee perfect reconstruction of deep chains like:

```text
store update -> component A -> component B -> async side effect -> current error
```

across arbitrary frameworks and event timing.

## Why This Works Well For Agents

Agent workflows are weaker at visual inspection and stronger at repeated structured queries.

That makes this shape useful:

```bash
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

Each step gives the model something explicit to compare instead of forcing it to infer state from a visual devtools session.
