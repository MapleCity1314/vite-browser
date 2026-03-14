# vite-browser v0.3.6

`v0.3.6` is the stabilization follow-up to the Enhanced React Support milestone. It keeps the `v0.3.5` React surface, then hardens browser startup, framework detection, and release validation so the shipped commands behave consistently in real environments.

## What changed

### React inspection stability fixes

`v0.3.6` keeps the bundled React hook, Zustand inspection, hook diagnostics, and commit tracing introduced in `v0.3.5`, but fixes the runtime mismatches that made those features fragile before release hardening:

- bundled hook now tracks committed fiber roots correctly
- renderer selection no longer assumes a hard-coded renderer id
- `react tree` recovers automatically when the hook is missing or the renderer has not attached yet
- framework detection no longer misclassifies non-React pages just because the bundled hook is present

### Browser launch and local validation hardening

Release validation is now more reliable across local environments:

- browser startup can reuse a system Chrome/Chromium executable when Playwright-managed browsers are unavailable
- `VITE_BROWSER_HEADLESS=1` is supported for automated validation flows
- Unix socket and temporary-path handling are more resilient in restricted environments

### Cross-platform E2E release gate repair

The repository E2E gate no longer depends on a machine-specific Windows setup or an out-of-repo demo:

- the E2E suite now uses the in-repo Vue fixture
- dev-server launch logic is cross-platform
- runtime checks use fixture-aligned assertions
- release smoke validation now runs cleanly as part of the repository gate

### Vue / Pinia detection recovery

Vue runtime detection and store/render tracing now recover even when Vue devtools globals are absent:

- mounted Vue app markers are used as a fallback signal
- Pinia subscriptions can attach from the mounted app instance
- `vite runtime` performs a lightweight framework re-check when the session framework is still unknown

## Commands available in this release

```bash
vite-browser react tree
vite-browser react store list
vite-browser react store inspect <name>
vite-browser react hook health
vite-browser react hook inject
vite-browser react commits --limit 20
vite-browser react commits clear
```

## Validation

Verified with:

- `pnpm typecheck`
- `pnpm test` (191 / 191 pass)
- `pnpm build`
- `pnpm docs:build`
- `pnpm test:evals:e2e` (3 / 3 pass)
- `npm pack --dry-run`

## Upgrade

```bash
npm install @presto1314w/vite-devtools-browser@0.3.6
```

No new configuration is required. If Playwright browsers are not installed locally, `vite-browser` can now fall back to a system Chrome/Chromium executable for validation and browser control.
