# vite-browser v0.3.0

## Summary

`v0.3.0` is the propagation-diagnostics release for `vite-browser`.

It extends the existing runtime diagnosis model with Vue-first propagation clues that help agents and developers narrow likely `store/module -> render -> error/network` paths from recent event windows.

## Highlights

- added `correlate renders` for propagation-oriented render/update summaries
- added `diagnose propagation` for structured `store/module -> render -> error` guidance
- added browser-side render and store-update collection with Vue-first Pinia support
- added top-level `changedKeys` reporting for store mutations
- split browser responsibilities into collector, session, framework adapters, and Vite diagnostics modules
- added shared typed event-analysis helpers for correlation and trace logic
- added conservative propagation eval coverage for:
  - store -> render -> error
  - render -> repeated network work
  - inconclusive propagation evidence
  - no propagation trace

## Validation

Release validation completed with:

- `pnpm typecheck`
- `pnpm test`
- `pnpm test:evals`
- `pnpm build`
- `pnpm test:evals:e2e`

## Notes

`v0.3.0` improves propagation-path visibility, but it does not claim strict causal proof across arbitrary component graphs. `correlate renders` and `diagnose propagation` should be read as high-confidence propagation clues with conservative fallback behavior when evidence is incomplete.
