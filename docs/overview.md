# Overview

## What is vite-browser?

`vite-browser` is a runtime diagnostics CLI for Vite applications. It connects to a running Vite dev server and exposes framework state, HMR activity, error correlation, and propagation clues as structured terminal output.

It is designed for two audiences:

- **Developers** who want terminal-native insight into runtime failures without clicking through DevTools panels.
- **AI coding agents** that need machine-readable signals to debug Vite apps step by step.

## Install

**As an Agent Skill** (recommended):

```bash
npx skills add MapleCity1314/vite-browser
```

This installs the skill router and the four capability packs it routes into. Your AI coding tool will automatically pick the right debugging workflow.

**As a CLI tool**:

```bash
npm install -g @presto1314w/vite-devtools-browser
npx playwright install chromium
```

## What it does

When a Vite app breaks after a hot update, the error overlay tells you _what_ failed. `vite-browser` tells you _why_:

- **Error correlation** — Match the current error against recent HMR-updated modules within a configurable time window.
- **Propagation diagnosis** — Trace `store → render → error` paths when a state change breaks a downstream component.
- **HMR diagnosis** — Detect patterns like `missing-module`, `circular-dependency`, or `hmr-websocket-closed` with confidence levels.
- **Framework inspection** — Query Vue component trees, Pinia stores, Vue Router; React component trees, Zustand stores, hook diagnostics, commit tracing; or Svelte component trees.
- **Mapped errors** — Source-mapped stack traces with optional inline source snippets.

## Capability map

`vite-browser` organizes its functionality into four focused packs. The skill router selects the right one based on the symptom:

| Pack | When to use | First commands |
|---|---|---|
| [Core Debug](/capabilities/core-debug) | The app is broken but the failure mode is unclear | `errors`, `logs`, `vite runtime` |
| [Runtime Diagnostics](/capabilities/runtime-diagnostics) | The issue appeared after an edit, hot update, or reload | `correlate errors`, `diagnose hmr`, `diagnose propagation` |
| [Network Regression](/capabilities/network-regression) | Wrong data, failed requests, or auth/CORS issues | `network`, `logs`, `errors --mapped` |
| [Release Smoke](/capabilities/release-smoke) | Final verification before merge or release | `detect`, `errors`, `network`, `vite runtime` |

## How it compares

| Tool | Best for | Difference |
|---|---|---|
| `agent-browser` | General browser automation | No Vite runtime awareness |
| `next-browser` | Next.js + React DevTools | Not a Vite tool |
| `vite-plugin-vue-mcp` | Vue MCP integration | Requires plugin install, Vue only |
| **`vite-browser`** | **Vite runtime diagnostics** | Zero-config, multi-framework, agent-native |

## Next steps

- [Getting Started](/guide/getting-started) — Install and run your first session
- [Agent Skills](/guide/agent-skills) — Understand the skill-first debugging model
- [Workflows](/guide/workflows) — Common debugging recipes
