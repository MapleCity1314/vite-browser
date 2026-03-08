# Launch Kit

This file collects short and long-form copy for introducing `vite-browser`.

## One-line Pitch

`vite-browser` is a runtime diagnostics CLI for Vite apps that exposes framework state, HMR traces, module graph diffs, and mapped errors as structured commands for agents and developers.

## Short Project Description

`vite-browser` helps debug Vite applications from the terminal. Instead of relying only on a GUI devtools panel, it exposes Vue, React, and Svelte runtime state plus Vite-specific diagnostics like HMR activity, module graph changes, and mapped build errors as structured shell output.

This makes it useful both for local debugging and for AI coding agents that need machine-readable insight into what a Vite app is doing at runtime.

## GitHub / Release Blurb

`vite-browser` is a debugging toolchain for Vite apps with a strong focus on runtime diagnostics. It combines framework inspection for Vue/React/Svelte with Vite-aware signals like HMR traces, module graph diffs, source-mapped errors, network logs, screenshots, and eval support.

It is designed for both human developers and AI agents that need structured runtime visibility instead of a GUI-only workflow.

## X / Twitter Post

Built `vite-browser`: a runtime diagnostics CLI for Vite apps.

It exposes:
- Vue / React / Svelte runtime state
- Vite HMR traces
- module graph snapshots + diffs
- mapped errors with inline source

Made for local debugging and AI agents that need structured runtime output instead of clicking through DevTools.

Repo: https://github.com/MapleCity1314/vite-browser

## Forum Post

I built `vite-browser`, a runtime diagnostics CLI for Vite applications.

The goal is simple: most browser tools focus on automation, and most devtools focus on GUI inspection. I wanted a tool that exposes Vite runtime behavior and framework state as structured shell output that both humans and AI agents can use directly.

Current capabilities include:

- Vue / React / Svelte runtime inspection
- Pinia and Vue Router inspection
- Vite runtime status
- HMR summary and trace
- module graph snapshot and diff
- mapped errors with optional inline source snippets
- network, logs, screenshots, and page eval

It is especially useful when you want an agent to debug a running Vite app without relying on a browser extension UI.

Repo: https://github.com/MapleCity1314/vite-browser

## Comparison Talking Points

- Against `agent-browser`: `vite-browser` is narrower but more Vite-aware.
- Against `next-browser`: `vite-browser` is for Vite workflows, not Next.js.
- Against `vite-plugin-vue-mcp`: `vite-browser` is CLI-first and framework-mixed, not only Vue + MCP plugin integration.

## Suggested GitHub Topics

- `vite`
- `devtools`
- `debugging`
- `runtime-diagnostics`
- `hmr`
- `module-graph`
- `sourcemap`
- `vue`
- `react`
- `svelte`
- `cli`
- `ai-agents`
