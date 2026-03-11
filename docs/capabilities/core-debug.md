# Core Debug

## What This Capability Is For

Use `core-debug` when the app is broken but the dominant failure mode is still unclear.

This is the broad first-pass capability. It helps answer:

- is this mostly a runtime/HMR problem
- is this really a network/data issue
- or is this still a framework/component-state problem

## What Humans Should Expect

This page is the fastest way to narrow a vague report like:

- "the page is broken"
- "the component state looks wrong"
- "the UI is weird after I changed something"

It does not try to prove root cause. It tries to classify the failure cleanly and hand off to the right next capability.

## Best Practices For AI

- Start here only when the failure mode is broad.
- Run the error-first gate before deep tree inspection.
- Route away quickly if the evidence is really runtime or network driven.
- Do not stay in `core-debug` once the dominant failure mode is obvious.

## Standard Sequence

```bash
vite-browser open <url>
vite-browser detect
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser logs
```

Then branch:

- Vue: `vue tree`, `vue pinia`, `vue router`
- React: `react tree`
- Svelte: `svelte tree`

Cross-check when needed:

```bash
vite-browser network
vite-browser screenshot
vite-browser eval '<script>'
```

## Routing Rules

Move to `runtime-diagnostics` if:

- the issue appeared right after a code edit or hot update
- the logs mention HMR, reloads, import failures, or websocket instability
- the page unexpectedly refreshes or full-reloads

Move to `network-regression` if:

- the main symptom is wrong data, missing data, or failed requests
- network entries show 4xx, 5xx, `FAIL`, auth, or CORS problems

## Expected Output

Return:

1. confirmed symptom
2. most likely failure class
3. evidence commands and key output
4. confidence level
5. minimal next step or next capability
