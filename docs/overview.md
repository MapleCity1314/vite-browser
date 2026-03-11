# Overview

## Install

The primary setup path is a single skill install command:

```bash
npx skills add MapleCity1314/vite-browser
```

That installs the router skill plus the capability packs it routes into.

Under the hood, the skill uses the `vite-browser` CLI as the execution layer, but the recommended product entrypoint is the skill router.

## What vite-browser Does

`vite-browser` is a skill-first runtime diagnostics surface for Vite apps.

It helps you:

- connect current errors to recent HMR activity
- inspect framework runtime state
- separate runtime failures from network/data failures
- produce release smoke evidence before merge or release

## Capability Map

### Core Debug

Use when the app is broken but the dominant failure mode is still broad or unclear.

### Runtime Diagnostics

Use when the problem is tied to a recent edit, hot update, reload, import failure, or rerender propagation path.

### Network Regression

Use when the symptom is wrong data, failed requests, auth breakage, or response mismatch.

### Release Smoke

Use when you want a structured go/no-go pass before merge or release.

## Best Practices For AI

- Start from the router, not from all packs at once.
- Prefer `errors --mapped --inline-source` as the first runtime read for live failures.
- Use the dominant symptom to choose the capability pack.
- Treat propagation output as high-confidence narrowing, not strict causal proof.
- Keep conclusions conservative when the evidence chain is incomplete.

## What To Read Next

- [Core Debug](/capabilities/core-debug)
- [Runtime Diagnostics](/capabilities/runtime-diagnostics)
- [Network Regression](/capabilities/network-regression)
- [Release Smoke](/capabilities/release-smoke)
- [v0.3.3 release notes](/release-notes-0.3.3)
