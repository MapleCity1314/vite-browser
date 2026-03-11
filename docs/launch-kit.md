# About

## Why vite-browser exists

Most browser tools focus on automation. Most devtools focus on GUI inspection. Neither gives you structured, queryable runtime diagnostics from the terminal.

`vite-browser` fills this gap: it turns Vite runtime behavior — HMR traces, module graph changes, framework component state, mapped errors, and network activity — into structured CLI output that both developers and AI agents can use directly.

## Design principles

**Zero footprint.** No plugins to install, no project config to change. Point at a running Vite dev server and start querying.

**Evidence over guesswork.** Every diagnostic command produces structured output with confidence levels. The tool prefers to say less rather than invent a story from weak evidence.

**Terminal-native.** Every command is a stateless request against a long-lived browser daemon. No GUI dependency, no browser lifecycle to manage per step.

**Skill-routed.** Instead of dumping all commands at once, the skill router picks the right debugging workflow for the symptom. This matters especially for AI agents, which perform better with focused toolsets.

## Who it's for

- **Developers** debugging hot-update failures, store-driven rendering bugs, or network regressions from the terminal.
- **AI coding agents** (Claude Code, Codex, Cursor) that need machine-readable runtime signals to diagnose Vite app failures step by step.
- **Teams** looking for a lightweight, repeatable runtime diagnostics layer that works across Vue, React, and Svelte without per-project setup.

## What sets it apart

- It is not a general browser automation framework — it is specifically built around the Vite runtime debugging loop.
- It is not a visual DevTools panel — it outputs structured data designed for terminal consumption and agent reasoning.
- It does not require any project modifications — no plugins, no config changes, no build-step integration.

## Current scope

`v0.3.3` is strong at:

- Surfacing runtime state as structured shell output
- Linking current errors to recent HMR and module activity
- Detecting common HMR failure patterns with confidence levels
- Narrowing likely `store → render → error` paths in Vue + Pinia workflows
- Capturing browser-side runtime errors even when the Vite overlay is absent

`correlate renders` and `diagnose propagation` are **high-confidence narrowing tools**, not strict causal proof engines. They do not trace deep chains across arbitrary component graphs, and intentionally fall back to conservative output when evidence is incomplete.

React store inspection (Zustand, Redux) and deeper cross-framework propagation tracing are on the roadmap.

## Links

- [GitHub Repository](https://github.com/MapleCity1314/vite-browser)
- [npm Package](https://www.npmjs.com/package/@presto1314w/vite-devtools-browser)
- [Getting Started](/guide/getting-started)
- [Release Notes](/release-notes-0.3.3)
