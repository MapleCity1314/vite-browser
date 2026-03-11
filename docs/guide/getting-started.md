# Getting Started

## Recommended Setup Order

For most users, the right order is:

1. install or check in the `vite-browser` skill router
2. add a small AI IDE routing config
3. keep the raw CLI available as the lower-level execution layer

If you have not done step 1 yet, start with:

- [Agent Skills](/guide/agent-skills)
- [AI IDE Setup](/guide/ide-setup)

## Requirements

- Node.js `>=20`
- Chromium installed through Playwright
- A running Vite dev server

## Skill-First Quickstart

### Claude Code

```bash
npx skills add MapleCity1314/vite-browser
```

Then add the repo hint from [AI IDE Setup](/guide/ide-setup#claude-code) to `CLAUDE.md`.

### Codex Or Cursor

Check `skills/` into the repo and add the routing snippet from [AI IDE Setup](/guide/ide-setup).

## CLI Layer

Install the CLI runtime used by the skills:

```bash
npm install -g @presto1314w/vite-devtools-browser
npx playwright install chromium
```

Or run without a global install:

```bash
npx @presto1314w/vite-devtools-browser open http://localhost:5173
```

## First Manual Session

Start your app in one terminal:

```bash
cd my-app
npm run dev
```

Then connect `vite-browser` in another terminal:

```bash
vite-browser open http://localhost:5173
vite-browser detect
vite-browser vite runtime
vite-browser errors --mapped --inline-source
vite-browser correlate errors --mapped --window 5000
vite-browser close
```

## Recommended Triage Paths

### HMR break after save

```bash
vite-browser vite hmr trace --limit 50
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

### Store-driven rerender failure

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser vue pinia
vite-browser vue tree
```

### Runtime or API issue

```bash
vite-browser logs
vite-browser network
vite-browser errors --mapped
```

## Notes

- `correlate renders` and `diagnose propagation` are designed as high-confidence narrowing, not strict causal proof.
- Vue runtime inspection is currently the deepest path. React and Svelte inspection are available, but cross-framework propagation coverage is still expanding.
