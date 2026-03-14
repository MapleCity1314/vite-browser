# Release Notes

This page is the English index for the published `vite-browser` release line. Detailed changes stay in the individual release notes.

## Current line

### v0.3.6

`v0.3.6` is the current stable release in the `v0.3` line. It keeps the Enhanced React Support surface from `v0.3.5`, then hardens browser launch, framework detection, and release validation so the shipped commands behave consistently in real environments.

Highlights:

- React inspection stability fixes around hook recovery, renderer selection, and root tracking
- system Chrome/Chromium fallback plus headless validation support
- repaired cross-platform E2E release gate using the in-repo Vue fixture
- stronger Vue / Pinia fallback detection when devtools globals are absent
- 191 tests passing (up from 154 in v0.3.3)

Release notes:

- [v0.3.6](/release-notes-0.3.6)
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
- `v0.3.6` hardens the shipped React/Vue inspection surface and the release gate itself.
- Patch releases mostly sharpen evidence quality rather than redefining the product model.
