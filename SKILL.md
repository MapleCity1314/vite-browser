---
name: vite-browser
description: >-
  CLI that gives agents access to Vue/React DevTools for Vite applications —
  component trees, Pinia stores, Vue Router, console logs, network requests —
  as shell commands that return structured text.
---

# vite-browser

`npm install -g vite-browser` then `npx playwright install chromium`.

Daemon at `~/.vite-browser/default.sock`. One browser, one page.

---

## Commands

### `open <url> [--cookies-json <file>]`

Launch browser, navigate to URL. With `--cookies-json`, sets auth cookies
before navigating (domain derived from URL hostname).

```
$ vite-browser open http://localhost:5173 --cookies-json cookies.json
opened → http://localhost:5173 (5 cookies for localhost)
```

Cookie file format: `[{"name":"token","value":"abc123..."}, ...]`

### `close`

Close browser and kill daemon.

---

### `goto <url>`

Full-page navigation (new document load). Server renders fresh.

```
$ vite-browser goto http://localhost:5173/about
→ http://localhost:5173/about
```

### `back`

Browser back button.

### `reload`

Hard reload current page.

---

## Framework Detection

### `detect`

Auto-detect the frontend framework and version.

```
$ vite-browser detect
vue@3.5.29
```

Detects: Vue 2/3, React, Svelte, and their versions.

---

## Vue Commands

### `vue tree [id]`

Show Vue component tree or inspect a specific component.

**Without ID** — full component tree:
```
$ vite-browser vue tree
# Vue Component Tree
# 1 app(s) detected

## App: App
  [0] App
    [1] HelloWorld
    [2] Counter
      [3] Button
```

**With ID** — inspect component details:
```
$ vite-browser vue tree 2
# Component: Counter
# UID: 2

## Props
  initialCount: 0

## Setup State
  count: 5
  increment: [Function]
  decrement: [Function]

## Computed
  doubleCount: 10

## Source
  /src/components/Counter.vue
```

Shows: props, data, setup state (Composition API), computed properties, and source file location.

### `vue pinia [store]`

Show Pinia stores or inspect a specific store.

**Without store name** — list all stores:
```
$ vite-browser vue pinia
# Pinia Stores

- counter
- user
- cart

Use 'vite-browser vue pinia <store-name>' to inspect a specific store
```

**With store name** — inspect store details:
```
$ vite-browser vue pinia counter
# Pinia Store: counter

## State
  count: 42
  lastUpdated: "2026-03-07T12:34:56.789Z"

## Getters
  doubleCount: 84
  isPositive: true
```

### `vue router`

Show Vue Router information.

```
$ vite-browser vue router
# Vue Router

## Current Route
  Path: /products/123
  Name: product-detail
  Params: {"id":"123"}
  Query: {"tab":"reviews"}

## All Routes
  /
  /about
  /products
  /products/:id
  /contact
```

---

## React Commands

### `react tree [id]`

Show React component tree or inspect a specific component.

```
$ vite-browser react tree
# React Component Tree
# (Coming soon)
```

---

## Utilities

### `screenshot`

Full-page PNG to a temp file. Returns the path. Read with the Read tool.

```
$ vite-browser screenshot
C:\Users\user\AppData\Local\Temp\vite-browser-1772885915670.png
```

### `eval <script>`

Run JavaScript in page context. Returns the result as JSON.

```
$ vite-browser eval 'document.title'
"Vite App"

$ vite-browser eval 'document.querySelectorAll("button").length'
12

$ vite-browser eval 'window.__VUE__?.version'
"3.5.29"
```

Use this to inspect global variables, DOM state, or framework internals.

---

## Debugging

### `logs`

Recent console logs from the browser.

```
$ vite-browser logs
[debug] [vite] connecting...
[debug] [vite] connected.
[warning] [Vue Router warn]: No match found for location with path "/"
[log] User clicked button
```

Shows: console.log, console.warn, console.error, console.debug.

### `errors`

Vite build and runtime errors.

```
$ vite-browser errors
[vite] Internal server error: Failed to resolve import
  Plugin: vite:import-analysis
  File: /src/main.ts:3:24
  1  | import { createApp } from 'vue'
  2  | import App from './App.vue'
  3  | import { missing } from './missing'
     |                         ^
```

Shows both build-time errors (TypeScript, import resolution) and runtime errors.

### `network [idx]`

List all network requests since last navigation.

**Without index** — list all requests:
```
$ vite-browser network
# Network requests since last navigation

[0] GET http://localhost:5173/ (200)
[1] GET http://localhost:5173/src/main.ts (200)
[2] GET http://localhost:5173/@vite/client (200)
[3] GET http://localhost:5173/node_modules/.vite/deps/vue.js (200)
[4] GET http://localhost:5173/src/App.vue (200)
[5] POST http://localhost:5173/api/users (201)
```

**With index** — inspect request details:
```
$ vite-browser network 5
POST http://localhost:5173/api/users
Status: 201 Created
Duration: 145ms

Request Headers:
  content-type: application/json
  accept: application/json

Request Body:
  {"name":"Alice","email":"alice@example.com"}

Response Headers:
  content-type: application/json
  x-powered-by: Express

Response Body:
  {"id":123,"name":"Alice","email":"alice@example.com"}
```

---

## Vite Commands

### `vite restart`

Restart the Vite dev server (if accessible via HMR API).

```
$ vite-browser vite restart
restarted
```

### `vite hmr`

Show HMR (Hot Module Replacement) update history.

```
$ vite-browser vite hmr
# HMR Updates

[12:34:56] /src/App.vue
[12:35:02] /src/components/Counter.vue
[12:35:15] /src/store/counter.ts
```

---

## Typical Workflows

### Debug Vue Component State

```bash
# Open app
vite-browser open http://localhost:5173

# Find component
vite-browser vue tree
# Output shows: [2] Counter

# Inspect component
vite-browser vue tree 2
# Shows props, state, computed

# Check Pinia store
vite-browser vue pinia counter
# Shows store state and getters
```

### Debug Network Issues

```bash
# Navigate to page
vite-browser goto http://localhost:5173/products

# List all requests
vite-browser network
# Output shows: [5] POST /api/products (404)

# Inspect failed request
vite-browser network 5
# Shows request/response details
```

### Debug Routing

```bash
# Check current route
vite-browser vue router
# Shows: Path: /unknown

# List all routes
vite-browser vue router
# Shows all defined routes

# Navigate to valid route
vite-browser goto http://localhost:5173/
```

### Debug Console Errors

```bash
# Check logs
vite-browser logs
# Shows: [error] Uncaught TypeError: ...

# Check Vite errors
vite-browser errors
# Shows build/runtime errors with stack traces

# Take screenshot to see visual state
vite-browser screenshot
```

---

## Tips for Agents

### Always Check Errors First

Before debugging component state or network issues, check for errors:
```bash
vite-browser errors
vite-browser logs
```

Build errors produce misleading component trees and empty network lists.

### Component IDs Are Temporary

Component IDs (from `vue tree`) are only valid until the next navigation.
After `goto` or `reload`, run `vue tree` again to get fresh IDs.

### Use `eval` for Custom Queries

When built-in commands don't provide what you need:
```bash
# Check if Pinia is installed
vite-browser eval 'window.__PINIA__ !== undefined'

# Get all component names
vite-browser eval 'Object.keys(window.__VUE_DEVTOOLS_GLOBAL_HOOK__.apps[0]._instance.type.components || {})'

# Check localStorage
vite-browser eval 'JSON.parse(localStorage.getItem("user"))'
```

### Screenshot for Visual Debugging

When users report "it looks wrong", take a screenshot:
```bash
vite-browser screenshot
# Returns path to PNG file
# Use Read tool to view it
```

### Network Debugging Pattern

1. `network` — list all requests
2. Find suspicious status codes (4xx, 5xx)
3. `network <idx>` — inspect failed request
4. Check request body, headers, response

### Pinia Store Debugging

1. `vue pinia` — list all stores
2. `vue pinia <name>` — inspect store state
3. If state looks wrong, check component that uses it:
   - `vue tree` — find component
   - `vue tree <id>` — check if it's reading correct store

---

## Limitations

- **React support**: Coming soon (tree inspection not yet implemented)
- **Svelte support**: Framework detection only, no DevTools integration yet
- **Multiple apps**: Only inspects the first Vue app on the page
- **Source maps**: File paths shown, but line numbers may not match original source
- **HMR monitoring**: Basic support, full history tracking coming soon

---

## Installation

```bash
# Global install
npm install -g @vercel/vite-browser

# Install Chromium
npx playwright install chromium

# Verify
vite-browser --help
```

## Requirements

- Node.js 20+
- Vite dev server running
- Vue 3 (for Vue DevTools features)
- Pinia (for store inspection)
- Vue Router (for routing features)

---

## Troubleshooting

### "connect ENOENT" error

The daemon isn't running. It starts automatically on first command, but if
it crashes, manually clean up:

```bash
# Windows
del %USERPROFILE%\.vite-browser\default.sock
del %USERPROFILE%\.vite-browser\default.pid

# macOS/Linux
rm ~/.vite-browser/default.sock
rm ~/.vite-browser/default.pid
```

### "Vue DevTools not found"

The app isn't using Vue, or Vue DevTools hook isn't initialized.
Check with:

```bash
vite-browser detect
vite-browser eval 'window.__VUE_DEVTOOLS_GLOBAL_HOOK__'
```

### "Pinia not found"

Pinia isn't installed or not exposed to window. Add to your `main.ts`:

```typescript
const pinia = createPinia()
app.use(pinia)
window.__PINIA__ = pinia  // Add this line
```

### Empty component tree

The Vue app hasn't mounted yet. Wait a moment and try again:

```bash
vite-browser reload
# Wait 2 seconds
vite-browser vue tree
```

---

## Comparison with Browser DevTools

| Feature | Browser DevTools | vite-browser |
|---------|------------------|--------------|
| Component tree | ✅ Visual tree | ✅ Text output |
| Props/state | ✅ Interactive | ✅ JSON output |
| Time travel | ✅ Yes | ❌ No |
| Network | ✅ Rich UI | ✅ Text list |
| Console | ✅ Interactive | ✅ Text log |
| Screenshots | ✅ Manual | ✅ Automated |
| **Agent access** | ❌ No | ✅ Yes |
| **Scriptable** | ❌ No | ✅ Yes |
| **CI/CD** | ❌ No | ✅ Yes |

vite-browser is designed for **programmatic access** by AI agents and scripts,
not as a replacement for human debugging with browser DevTools.
