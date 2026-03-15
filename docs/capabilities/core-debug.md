# Core Debug

## When to use

Use `core-debug` when the app is broken but you don't yet know whether the root cause is a runtime/HMR issue, a network/data problem, or a framework state bug.

This is the **broad first-pass** capability. It classifies the failure and routes you to the right next step.

## Typical symptoms

- _"The page is broken"_
- _"The component state looks wrong"_
- _"Something changed and the UI is weird"_

## Sequence

```bash
vite-browser open <url>
vite-browser detect
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser logs
```

Then inspect framework state based on what `detect` returned:

- **Vue:** `vue tree`, `vue pinia`, `vue router`
- **React:** `react tree`, `react store list`, `react store inspect <name>`, `react hook health`, `react commits`
- **Svelte:** `svelte tree`

Cross-check when needed:

```bash
vite-browser network
vite-browser screenshot
vite-browser eval '<script>'
```

## Routing out

Move to **[Runtime Diagnostics](/capabilities/runtime-diagnostics)** when:
- The issue appeared right after a code edit or hot update
- Logs mention HMR, reloads, import failures, or websocket instability
- The page unexpectedly full-reloads

Move to **[Network Regression](/capabilities/network-regression)** when:
- The main symptom is wrong or missing data
- Network entries show 4xx, 5xx, auth, or CORS problems

## Expected output

1. Confirmed symptom
2. Most likely failure class (runtime / network / state)
3. Evidence commands and key output
4. Confidence level
5. Recommended next capability
