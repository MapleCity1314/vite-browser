---
name: vite-browser
description: >-
  Agent skill for debugging Vite apps through the vite-browser CLI: framework
  detection, Vue/React/Svelte component inspection, Pinia/Router info, logs,
  errors, network tracing, screenshots, and page evaluation.
---

# vite-browser

Install CLI:

```bash
npm install -g @presto1314w/vite-devtools-browser
npx playwright install chromium
```

Install this skill:

```bash
npx skills add MapleCity1314/vite-browser
```

Daemon uses one browser and one page. Socket path is session-scoped:
- Default session: `~/.vite-browser/default.sock` (or Windows pipe `\\.\\pipe\\vite-browser-default`)
- Custom session: set `VITE_BROWSER_SESSION=<name>`

---

## Commands

### Browser control

```bash
vite-browser open <url> [--cookies-json <file>]
vite-browser close
vite-browser goto <url>
vite-browser back
vite-browser reload
```

`open --cookies-json` expects:

```json
[{"name":"token","value":"abc123"}]
```

### Framework detection

```bash
vite-browser detect
```

Returns `vue@x`, `react@y`, `svelte@z`, or `unknown`.

### Vue

```bash
vite-browser vue tree
vite-browser vue tree <id>
vite-browser vue pinia
vite-browser vue pinia <store>
vite-browser vue router
```

`vue tree <id>` shows props/data/setup/computed/source when available.

### React

```bash
vite-browser react tree
vite-browser react tree <id>
```

- `react tree` returns the component tree from React DevTools bridge operations.
- `react tree <id>` inspects props/hooks/state/context and source (if exposed).

### Svelte

```bash
vite-browser svelte tree
vite-browser svelte tree <id>
```

Best-effort runtime inspection. Availability depends on what the app exposes.

### Vite diagnostics

```bash
vite-browser vite restart
vite-browser vite hmr
vite-browser errors
vite-browser logs
```

Notes:
- `vite restart` requires an app endpoint at `/__vite_restart`.
- `errors` reads Vite error overlay from the page.

### Utilities

```bash
vite-browser screenshot
vite-browser eval <script>
vite-browser network
vite-browser network <idx>
```

- `network` lists requests since last document navigation.
- `network <idx>` includes request/response headers, bodies, and timing when available.

---

## Typical workflow

```bash
vite-browser open http://localhost:5173
vite-browser detect
vite-browser errors
vite-browser logs
vite-browser network
vite-browser vue tree
```

For React:

```bash
vite-browser react tree
vite-browser react tree <id>
```

For Svelte:

```bash
vite-browser svelte tree
vite-browser svelte tree <id>
```

---

## Practical guidance for agents

- Check `errors` and `logs` first before deep inspection.
- Re-run `vue tree` and `react tree` after navigation/reload; IDs are not stable across page reloads.
- Use `eval` for app-specific checks not covered by built-ins.
- Use `screenshot` when visual state matters.
- Use `network <idx>` to inspect failed API calls.

---

## Current limitations

- React inspection depends on React DevTools hook availability in the page context.
- Svelte inspection is heuristic and may be partial on some builds/apps.
- Vue router and Pinia commands require those integrations to be present in the app.
- `vite restart` only works if the target app implements `/__vite_restart`.

---

## Troubleshooting

### Cannot connect to daemon

Clean stale session files and retry:

```bash
# Windows (default session)
del %USERPROFILE%\.vite-browser\default.pid

# macOS/Linux (default session)
rm ~/.vite-browser/default.pid ~/.vite-browser/default.sock
```

### React tree returns hook/renderer errors

- Ensure React app is loaded and not crashed.
- Reload page and run `react tree` again.

### Empty Svelte output

The app may not expose enough runtime metadata. Use `eval` plus logs/network as fallback.