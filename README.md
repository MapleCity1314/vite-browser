# @vercel/vite-browser

Programmatic access to Vue/React DevTools and Vite dev server. Everything you'd interact with in a GUI — component trees, props, state, Pinia stores, HMR status, build errors — exposed as shell commands that return structured text.

Built for agents. An LLM can't read a DevTools panel, but it can run `vite-browser vue tree`, parse the output, and decide what to inspect next. Each command is a stateless one-shot against a long-lived browser daemon, so an agent loop can fire them off without managing browser lifecycle.

## Status

🚧 **Early prototype** - Basic architecture in place, Vue/React DevTools integration in progress.

## Install

```bash
pnpm add -g @vercel/vite-browser
npx playwright install chromium
```

Requires Node `>=20`.

## Usage

```bash
vite-browser open http://localhost:5173
vite-browser detect
vite-browser vue tree
vite-browser errors
vite-browser close
```

## Commands

### Browser Control
```
open <url> [--cookies-json <file>]  Launch browser and navigate
close                               Close browser and daemon
goto <url>                          Full-page navigation
back                                Go back in history
reload                              Reload current page
```

### Framework Detection
```
detect                              Detect framework (vue/react/svelte)
```

### Vue Commands
```
vue tree [id]                       Show Vue component tree or inspect component
vue pinia [store]                   Show Pinia stores or inspect specific store
vue router                          Show Vue Router information
```

### React Commands
```
react tree [id]                     Show React component tree or inspect component
```

### Vite Commands
```
vite restart                        Restart Vite dev server
vite hmr                            Show HMR status
errors                              Show build/runtime errors
logs                                Show dev server logs
```

### Utilities
```
screenshot                          Save screenshot to temp file
eval <script>                       Evaluate JavaScript in page context
network [idx]                       List network requests or inspect one
```

## Architecture

Similar to `@vercel/next-browser`:
- CLI + Daemon + Unix socket communication
- Playwright with headed browser
- Framework-specific DevTools integration
- Vite dev server integration

## Development

```bash
# Install dependencies
pnpm install

# Run from source
pnpm dev open http://localhost:5173

# Build
pnpm build

# Type check
pnpm typecheck
```

## Roadmap

- [x] Basic architecture (CLI, daemon, browser)
- [x] Framework detection
- [x] Vite error/log capture
- [ ] Vue DevTools integration (@vue/devtools-kit)
- [ ] Vue component tree inspection
- [ ] Pinia store inspection
- [ ] Vue Router integration
- [ ] React DevTools integration (from next-browser)
- [ ] HMR monitoring
- [ ] Vite server restart (requires plugin)
- [ ] Documentation and examples
- [ ] Tests

## Comparison

| Feature | next-browser | vite-browser |
|---------|-------------|--------------|
| Target | Next.js only | Vite (Vue/React/Svelte) |
| DevTools | React DevTools | Vue + React DevTools |
| Special | PPR analysis | HMR monitoring |
| Server | Next.js dev server | Vite dev server |

## License

MIT
