# vite-browser

Agent Skill for AI coding assistants to debug Vite applications with structured access to Vue/React/Svelte runtime state. The CLI is the supporting runtime used by the skill for component trees, store/router inspection, logs, network traces, screenshots, and scripted page evaluation.

## Skills

```bash
npx skills add MapleCity1314/vite-browser
```

## CLI Installation (Optional)

```bash
npm install -g @presto1314w/vite-devtools-browser
npx playwright install chromium
```

## Quick Start

```bash
# Start your Vite dev server
cd my-vue-app
npm run dev

# In another terminal
vite-browser open http://localhost:5173
vite-browser detect              # vue@3.5.29 / react@19.x / svelte@x
vite-browser vue tree            # Vue component tree
vite-browser react tree          # React component tree
vite-browser svelte tree         # Svelte component tree (best effort)
vite-browser screenshot          # Take screenshot
vite-browser logs                # Console logs
vite-browser network             # Network requests
vite-browser close
```

## Features

- Framework Detection: Auto-detect Vue, React, Svelte and versions (best effort)
- Vue DevTools: Component tree, props, state, computed properties, source locations
- React DevTools: Component tree + component inspection (props/hooks/state/context)
- Svelte Support: Component tree + component detail inspection when runtime metadata is available
- Pinia Integration: Inspect store state and getters
- Vue Router: Current route, params, query, all routes
- Network Monitoring: Track requests, headers, bodies, and response payloads
- Console Logs: Capture console.log, warn, error, debug
- Screenshots: Full-page PNG screenshots
- JavaScript Evaluation: Run arbitrary JS in page context
- Vite Integration: Error tracking, HMR monitoring

## Commands

### Browser Control
```bash
vite-browser open <url>           # Launch browser and navigate
vite-browser close                # Close browser and daemon
vite-browser goto <url>           # Navigate to URL
vite-browser back                 # Go back
vite-browser reload               # Reload page
```

### Framework Detection
```bash
vite-browser detect               # Detect framework and version
```

### Vue DevTools
```bash
vite-browser vue tree             # Show component tree
vite-browser vue tree <id>        # Inspect component details
vite-browser vue pinia            # List all Pinia stores
vite-browser vue pinia <store>    # Inspect specific store
vite-browser vue router           # Show router information
```

### React DevTools
```bash
vite-browser react tree           # Show React component tree
vite-browser react tree <id>      # Inspect props/hooks/state/context/source
```

### Svelte
```bash
vite-browser svelte tree          # Show Svelte component tree
vite-browser svelte tree <id>     # Inspect Svelte component details
```

### Debugging
```bash
vite-browser screenshot           # Take full-page screenshot
vite-browser eval <script>        # Run JavaScript in page
vite-browser logs                 # Show console logs
vite-browser errors               # Show Vite errors
vite-browser network              # List network requests
vite-browser network <idx>        # Inspect specific request
```

## Architecture

- Daemon + Socket: Background process with socket communication
- Playwright: Headed Chromium browser
- One Browser, One Page: Single persistent browser instance
- Auto-start: Daemon starts automatically on first command

## Requirements

- Node.js 20+
- Chromium (via Playwright)
- Vite dev server running
- Vue/React/Svelte app for framework-specific commands

## Documentation

See [SKILL.md](./skills/SKILL.md) for complete command reference and usage examples.

## License

MIT
