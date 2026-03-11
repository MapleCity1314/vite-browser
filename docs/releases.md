# Release Notes

This page is the English index for the published `vite-browser` release line. Detailed changes stay in the individual release notes.

## Current line

### v0.3.3

`v0.3.3` is the current stable patch in the `v0.3` line. The main work in this release is improving how runtime evidence is stitched together for real Vite 7, Vue, and Pinia hot-update failures.

Highlights:

- error correlation keeps the right source-module direction more reliably when the visible stack lands downstream
- `changedKeys` and source-module hints survive partial signal streams more often
- stale runtime errors are cleared after recovery so the current page state is easier to trust

Release notes:

- [v0.3.3](/release-notes-0.3.3)
- [v0.3.2](/release-notes-0.3.2)
- [v0.3.1](/release-notes-0.3.1)
- [v0.3.0](/release-notes-0.3.0)
- [v0.2.2](/release-notes-0.2.2)

## How to read the line

- `v0.2.x` marks the shift from observation toward diagnosis.
- `v0.3.x` focuses on stronger propagation clues and more reliable realtime evidence.
- Patch releases mostly sharpen evidence quality rather than redefining the product model.
