---
name: vite-browser
description: >-
  Agent skill for diagnosing Vite apps through a structured workflow: detect
  framework, check errors/logs, inspect component trees and state, verify
  network and visual output, then report concrete fixes.
---

# vite-browser

Use this skill when an AI agent needs to debug or inspect a running Vite app.
The CLI is the execution layer; this document is the decision workflow.

Install CLI:

```bash
npm install -g @presto1314w/vite-devtools-browser
npx playwright install chromium
```

Install skill:

```bash
npx skills add MapleCity1314/vite-browser
```

---

## Working model

One daemon, one browser, one page per session.

- Default socket: `~/.vite-browser/default.sock`
- Windows default pipe: `\\.\\pipe\\vite-browser-default`
- Isolated sessions: set `VITE_BROWSER_SESSION=<name>`

---

## Agent protocol (always follow)

### 1) Open and baseline

```bash
vite-browser open <url>
vite-browser detect
```

Immediately record framework and URL.

### 2) Error-first gate

Before any component analysis:

```bash
vite-browser errors
vite-browser logs
```

If build/runtime errors exist, fix those first. Tree/state output is often misleading under compile/runtime failure.

### 3) Choose framework path

- Vue issue -> Vue workflow
- React issue -> React workflow
- Svelte issue -> Svelte workflow
- Unknown framework -> use `eval`, `network`, `screenshot`, and logs/errors

### 4) Validate behavior

For data/API/UI bugs:

```bash
vite-browser network
vite-browser network <idx>
vite-browser screenshot
```

### 5) Report with evidence

In your final response, include:
- what command(s) confirmed the issue
- concrete failing signal (error/log/request/component state)
- minimal fix hypothesis
- what to re-run to verify

---

## Vue workflow

### Discover and inspect components

```bash
vite-browser vue tree
vite-browser vue tree <id>
```

Use `vue tree` to locate target component IDs, then inspect props/data/setup/computed/source.

### Check global state and routing

```bash
vite-browser vue pinia
vite-browser vue pinia <store>
vite-browser vue router
```

Use this when symptom is stale state, wrong derived values, or incorrect route params/query.

---

## React workflow

### Build tree snapshot

```bash
vite-browser react tree
vite-browser react tree <id>
```

Use `react tree` first, then `react tree <id>` for props/hooks/state/context/source.

Notes:
- IDs are only reliable until navigation/reload.
- Re-run `react tree` after page transitions.

---

## Svelte workflow

```bash
vite-browser svelte tree
vite-browser svelte tree <id>
```

Svelte inspection is best-effort. If output is sparse:
- rely on `errors`/`logs`
- use `network` to verify data path
- use `eval` for targeted runtime checks

---

## Cross-framework debugging playbooks

### API/data mismatch

```bash
vite-browser network
vite-browser network <idx>
```

Confirm request URL/method/status, then inspect headers/body.

### Visual regression or "looks wrong"

```bash
vite-browser screenshot
```

Capture current UI state before and after a suspected action.

### Runtime probes

```bash
vite-browser eval '<script>'
```

Use for one-off checks not covered by built-ins (window globals, DOM snapshots, local storage state).

### Navigation reset

```bash
vite-browser goto <url>
vite-browser reload
vite-browser back
```

After navigation, regenerate component trees before reusing IDs.

---

## Command reference (quick)

### Browser

```bash
vite-browser open <url> [--cookies-json <file>]
vite-browser close
vite-browser goto <url>
vite-browser back
vite-browser reload
```

### Detection

```bash
vite-browser detect
```

### Vue

```bash
vite-browser vue tree [id]
vite-browser vue pinia [store]
vite-browser vue router
```

### React

```bash
vite-browser react tree [id]
```

### Svelte

```bash
vite-browser svelte tree [id]
```

### Vite diagnostics

```bash
vite-browser vite restart
vite-browser vite hmr
vite-browser errors
vite-browser logs
```

### Utilities

```bash
vite-browser screenshot
vite-browser eval <script>
vite-browser network [idx]
```

---

## Known limits

- React inspection needs React DevTools hook/renderer availability.
- Svelte introspection depends on runtime metadata exposure.
- Vue router/pinia commands require those integrations to exist in the app.
- `vite restart` works only if app provides `/__vite_restart` endpoint.

---

## Troubleshooting

### Cannot connect to daemon

```bash
# Windows
del %USERPROFILE%\.vite-browser\default.pid

# macOS/Linux
rm ~/.vite-browser/default.pid ~/.vite-browser/default.sock
```

### Tree inspection fails after page changes

Re-open tree snapshot after navigation/reload:

```bash
vite-browser vue tree
vite-browser react tree
vite-browser svelte tree
```