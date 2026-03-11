# Getting Started

## Prerequisites

- Node.js `>=20`
- Chromium via Playwright
- A running Vite dev server

## Quick setup

### Option 1: Agent Skill (recommended)

Install the skill router — your AI coding tool will automatically route into the right debugging workflow:

```bash
# Claude Code
npx skills add MapleCity1314/vite-browser
```

For Codex or Cursor, check `skills/` into your repo and add a routing snippet. See [AI IDE Setup](/guide/ide-setup) for details.

### Option 2: CLI only

```bash
npm install -g @presto1314w/vite-devtools-browser
npx playwright install chromium
```

Or run without a global install:

```bash
npx @presto1314w/vite-devtools-browser open http://localhost:5173
```

## Your first session

Start your app in one terminal:

```bash
cd my-app && npm run dev
```

Connect `vite-browser` in another:

```bash
# 1. Open the browser and navigate to your app
vite-browser open http://localhost:5173

# 2. Detect which framework is running
vite-browser detect

# 3. Check the Vite runtime state
vite-browser vite runtime

# 4. See current errors with source context
vite-browser errors --mapped --inline-source

# 5. Correlate with recent HMR activity
vite-browser correlate errors --mapped --window 5000

# 6. Done — close the browser
vite-browser close
```

## Common triage paths

### HMR break after save

```bash
vite-browser vite hmr trace --limit 50
vite-browser correlate errors --mapped --window 5000
vite-browser diagnose hmr --limit 50
```

### Store-driven render failure

```bash
vite-browser correlate renders --window 5000
vite-browser diagnose propagation --window 5000
vite-browser vue pinia
```

### API or data issue

```bash
vite-browser errors --mapped
vite-browser logs
vite-browser network
```

## What's next

- [Concepts](/guide/concepts) — Understand the product model and confidence levels
- [Agent Skills](/guide/agent-skills) — Learn the skill-first debugging approach
- [Workflows](/guide/workflows) — Detailed debugging recipes
