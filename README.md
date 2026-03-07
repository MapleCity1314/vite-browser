# vite-browser

CLI for programmatic access to Vue/React DevTools in Vite applications. Provides component trees, props, state, Pinia stores, Vue Router, console logs, and network requests as structured text output — designed for AI agents and automation.

## Installation

```bash
npm install -g vite-browser
npx playwright install chromium
```

## Quick Start

```bash
# Start your Vite dev server
cd my-vue-app
npm run dev

# In another terminal
vite-browser open http://localhost:5173
vite-browser detect              # vue@3.5.29
vite-browser vue tree            # Component tree
vite-browser vue pinia           # Pinia stores
vite-browser vue router          # Vue Router info
vite-browser screenshot          # Take screenshot
vite-browser logs                # Console logs
vite-browser network             # Network requests
vite-browser close
```

## Features

- **Framework Detection**: Auto-detect Vue, React, Svelte and their versions
- **Vue DevTools**: Component tree, props, state, computed properties, source locations
- **Pinia Integration**: Inspect store state and getters
- **Vue Router**: Current route, params, query, all routes
- **Network Monitoring**: Track all HTTP requests with headers and bodies
- **Console Logs**: Capture console.log, warn, error, debug
- **Screenshots**: Full-page PNG screenshots
- **JavaScript Evaluation**: Run arbitrary JS in page context
- **Vite Integration**: Error tracking, HMR monitoring

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

### Debugging
```bash
vite-browser screenshot           # Take full-page screenshot
vite-browser eval <script>        # Run JavaScript in page
vite-browser logs                 # Show console logs
vite-browser errors               # Show Vite errors
vite-browser network              # List network requests
vite-browser network <idx>        # Inspect specific request
```

## Example Output

### Component Tree
```
$ vite-browser vue tree
# Vue Component Tree
# 1 app(s) detected

## App: App
  [0] App
    [1] HelloWorld
    [2] Counter
```

### Component Details
```
$ vite-browser vue tree 2
# Component: Counter
# UID: 2

## Props
  initialCount: 0

## Setup State
  count: 5
  increment: [Function]

## Source
  /src/components/Counter.vue
```

### Pinia Store
```
$ vite-browser vue pinia counter
# Pinia Store: counter

## State
  count: 42

## Getters
  doubleCount: 84
```

## Architecture

- **Daemon + Socket**: Background process with Unix socket communication
- **Playwright**: Headed Chromium browser with DevTools protocol access
- **One Browser, One Page**: Single persistent browser instance
- **Auto-start**: Daemon starts automatically on first command

## Use Cases

- **AI Agents**: Programmatic debugging and inspection of Vite apps
- **Automation**: Scripted testing and monitoring
- **CI/CD**: Automated visual regression testing
- **Documentation**: Generate component documentation from live apps

## Requirements

- Node.js 20+
- Chromium (via Playwright)
- Vite dev server running
- Vue 3 (for Vue DevTools features)

## Documentation

See [SKILL.md](./SKILL.md) for complete command reference and usage examples.

## License

MIT
