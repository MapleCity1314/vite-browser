# vite-browser v0.3.5

`v0.3.5` delivers the Enhanced React Support milestone: Zustand store inspection, bundled hook diagnostics, lightweight React commit tracing, and a bundled DevTools hook that removes the need for any external extension.

## What changed

### Bundled React DevTools hook — zero-config setup

`v0.3.4` and earlier required a local `REACT_DEVTOOLS_EXTENSION` path to unlock deep React inspection. `v0.3.5` ships an internal minimal hook implementation that is injected before React initializes, giving the same inspection surface with no installation step.

- Hook is auto-injected on every page open
- The `REACT_DEVTOOLS_EXTENSION` environment variable is no longer required

### Zustand state management support

The CLI can now discover and read Zustand stores running in the page:

```bash
vite-browser react store list          # list all detected stores
vite-browser react store inspect <n>   # print current state of store n
```

Detection works by scanning for the Zustand internal subscription registry. Circular references in store state are handled gracefully.

### React hook diagnostics

React inspection is now easier to validate and recover from the CLI:

```bash
vite-browser react hook health         # print bundled hook status
vite-browser react hook inject         # inject the hook into the current page
```

`react tree` also retries automatically after a hook recovery attempt when the initial inspection fails because the hook is missing or the renderer has not attached yet.

### React commit tracing

The CLI now exposes lightweight React commit records without pretending to offer full Profiler parity:

```bash
vite-browser react commits --limit 20  # show recent commit records
vite-browser react commits clear       # clear recorded commit history
```

Commit output focuses on stable metadata such as root name, phase, fiber count, and measured duration when React exposes it. Unknown durations are reported as `n/a` rather than fabricated.

### React 18 + Vite test fixture

A self-contained test application (`test/fixtures/react-app/`) with React 18, Zustand, and React Router is now part of the pnpm workspace. It is used by the new unit tests and is available for local E2E validation.

### Code quality improvements (carried from v0.3.4 polishing)

- Consolidated duplicate `removeSocketFile` across daemon startup paths
- O(n²) → O(n) deduplication in Vue devtools component tree walker (Set-based)
- `formatComponentTree` now enforces a depth cap to prevent unbounded recursion
- `isLinux` is exported from a single location (`paths.ts`) and referenced everywhere

## Test count

191 tests passing (up from 154 in v0.3.3).

## Validation

Verified with:

- `pnpm build`
- `pnpm typecheck`
- `pnpm test` (191 / 191 pass)

## Upgrade

```bash
npm install @presto1314w/vite-devtools-browser@0.3.5
```

No configuration changes are required. If you previously set `REACT_DEVTOOLS_EXTENSION`, you can remove it — the bundled hook takes over automatically.
