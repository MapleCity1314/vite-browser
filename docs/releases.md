# Release Notes

This page is the English index for the published `vite-browser` release line. Detailed changes stay in the individual release notes.

## Current line

### v0.3.5

`v0.3.5` is the current stable release in the `v0.3` line. It delivers the Enhanced React Support milestone: Zustand store inspection, React render profiling via the DevTools Profiler API, and a bundled DevTools hook that removes the need for any external extension installation.

Highlights:

- zero-config React DevTools hook — no `REACT_DEVTOOLS_EXTENSION` path required
- `react store list` and `react store inspect` commands for Zustand state management
- render phase, duration, and slow-render (>16 ms) tracking via Profiler API
- self-contained React 18 + Zustand + React Router test fixture
- 175 tests passing (up from 154 in v0.3.3)

Release notes:

- [v0.3.5](/release-notes-0.3.5)
- [v0.3.3](/release-notes-0.3.3)
- [v0.3.2](/release-notes-0.3.2)
- [v0.3.1](/release-notes-0.3.1)
- [v0.3.0](/release-notes-0.3.0)
- [v0.2.2](/release-notes-0.2.2)

## How to read the line

- `v0.2.x` marks the shift from observation toward diagnosis.
- `v0.3.x` focuses on stronger propagation clues and more reliable realtime evidence.
- `v0.3.4` brought cross-platform stability and self-contained test infrastructure.
- `v0.3.5` expands React support to match the Vue/Pinia diagnostic depth.
- Patch releases mostly sharpen evidence quality rather than redefining the product model.
