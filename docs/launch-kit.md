# Launch Kit

This file collects short and long-form copy for introducing `vite-browser`.

## One-line Pitch

`vite-browser` is a runtime diagnostics CLI for Vite apps that exposes framework state, HMR traces, event correlation, propagation clues, and HMR diagnosis as structured commands for agents and developers.

## Short Project Description

`vite-browser` helps debug Vite applications from the terminal. Instead of relying only on a GUI devtools panel, it exposes Vue, React, and Svelte runtime state plus Vite-specific diagnostics like HMR activity, module graph changes, mapped build errors, recent-error correlation, propagation hints from store/rerender activity, and rule-based HMR diagnosis as structured shell output.

This makes it useful both for local debugging and for AI coding agents that need machine-readable insight into what a Vite app is doing at runtime.

## Agent-Focused Positioning

`vite-browser` is built for agent loops, not only for manual terminal use.

The key idea is simple: models do much better when runtime state is available as structured shell output instead of hidden behind a visual DevTools workflow. `vite-browser` exposes framework state, Vite runtime health, HMR signals, module graph diffs, mapped errors, correlation between recent updates and current failures, early propagation clues, diagnosis hits, logs, and network activity as commands that can be queried repeatedly and reasoned about step by step.

Its command model is also agent-friendly. Each CLI call is a stateless request against a long-lived browser daemon, so agents can iterate on a running app without having to rebuild browser lifecycle management for every step.

## GitHub / Release Blurb

`vite-browser` is a debugging toolchain for Vite apps with a strong focus on runtime diagnostics. It combines framework inspection for Vue/React/Svelte with Vite-aware signals like HMR traces, module graph diffs, source-mapped errors, recent-error correlation, early propagation clues, network logs, screenshots, and eval support.

It is designed for both human developers and AI agents that need structured runtime visibility instead of a GUI-only workflow.

## X / Twitter Post

Built `vite-browser`: a runtime diagnostics CLI for Vite apps.

It exposes:
- Vue / React / Svelte runtime state
- Vite HMR traces
- error-to-HMR correlation
- render/store propagation clues
- rule-based HMR diagnosis
- module graph snapshots + diffs
- mapped errors with inline source

Made for local debugging and AI agents that need structured runtime output instead of clicking through DevTools.

Repo: https://github.com/MapleCity1314/vite-browser

## Forum Post

I built `vite-browser`, a runtime diagnostics CLI for Vite applications.

The goal is simple: most browser tools focus on automation, and most devtools focus on GUI inspection. I wanted a tool that exposes Vite runtime behavior and framework state as structured shell output that both humans and AI agents can use directly.

It is particularly useful for agent workflows. A model can query structured runtime output and compare results across steps much more reliably than it can navigate a visual DevTools panel. `vite-browser` keeps that loop simple by exposing each inspection step as a CLI command backed by a persistent browser daemon.

Current capabilities include:

- Vue / React / Svelte runtime inspection
- Pinia and Vue Router inspection
- Vite runtime status
- HMR summary and trace
- module graph snapshot and diff
- error/HMR correlation over recent event windows
- render/store propagation correlation over recent event windows
- early propagation diagnosis with store updates, changed keys, and render paths
- rule-based HMR diagnosis with confidence levels
- mapped errors with optional inline source snippets
- network, logs, screenshots, and page eval

It is especially useful when you want an agent to debug a running Vite app without relying on a browser extension UI.

Repo: https://github.com/MapleCity1314/vite-browser

## Comparison Talking Points

- Against `agent-browser`: `vite-browser` is narrower but more Vite-aware.
- Against `next-browser`: `vite-browser` is for Vite workflows, not Next.js.
- Against `vite-plugin-vue-mcp`: `vite-browser` is CLI-first and framework-mixed, not only Vue + MCP plugin integration.

## Positioning Notes For v0.2.x

Use these points consistently:

- `v0.2.x` is the release line where `vite-browser` moves from point-in-time inspection toward diagnosis.
- It can now correlate the current error with recent HMR-updated modules.
- It can now surface diagnosis results like `missing-module`, `circular-dependency`, `hmr-websocket-closed`, and `repeated-full-reload`.
- It is strong at first-pass runtime triage and narrowing the search space for an AI agent.
- `v0.2.2` is the stabilization patch that tightens wording, evidence handling, and diagnosis coverage without changing the product model.
- It does not yet claim full component propagation tracing or perfect root-cause inference across deep dependency chains.
- `v0.3` propagation output should be positioned as high-confidence clues and conservative narrowing, not strict causal proof.

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
