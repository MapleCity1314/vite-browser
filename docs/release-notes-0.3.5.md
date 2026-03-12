# vite-browser v0.3.5

`v0.3.5` delivers the Enhanced React Support milestone: Zustand store inspection, React render profiling, and a bundled DevTools hook that removes the need for any external extension.

## What changed

### Bundled React DevTools hook — zero-config setup

`v0.3.4` and earlier required a local `REACT_DEVTOOLS_EXTENSION` path to unlock deep React inspection. `v0.3.5` ships an internal minimal hook implementation that is injected before React initializes, giving the same inspection surface with no installation step.

- Hook is auto-injected on every page open
- Health checks detect stale or missing hooks and re-inject automatically
- The `REACT_DEVTOOLS_EXTENSION` environment variable is no longer required

### Zustand state management support

The CLI can now discover and read Zustand stores running in the page:

```bash
vite-browser react store list          # list all detected stores
vite-browser react store inspect <n>   # print current state of store n
```

Detection works by scanning for the Zustand internal subscription registry. Circular references in store state are handled gracefully.

### React render tracking and profiling

Render events captured by the browser collector now include:

- **phase** — `mount` or `update`
- **actualDuration** — wall time the component spent rendering (ms)
- **slow** — `true` when `actualDuration > 16 ms`

This integrates the React DevTools Profiler API, so the data is sourced from the same instrumentation React itself uses.

### React 18 + Vite test fixture

A self-contained test application (`test/fixtures/react-app/`) with React 18, Zustand, and React Router is now part of the pnpm workspace. It is used by the new unit tests and is available for local E2E validation.

### Code quality improvements (carried from v0.3.4 polishing)

- Consolidated duplicate `removeSocketFile` across daemon startup paths
- O(n²) → O(n) deduplication in Vue devtools component tree walker (Set-based)
- `formatComponentTree` now enforces a depth cap to prevent unbounded recursion
- `isLinux` is exported from a single location (`paths.ts`) and referenced everywhere

## Test count

175 tests passing (up from 154 in v0.3.3).

## Validation

Verified with:

- `pnpm build`
- `pnpm typecheck`
- `pnpm test` (175 / 175 pass)

## Upgrade

```bash
npm install @presto1314w/vite-devtools-browser@0.3.5
```

No configuration changes are required. If you previously set `REACT_DEVTOOLS_EXTENSION`, you can remove it — the bundled hook takes over automatically.
