# vite-browser v0.2.2

## Summary

`v0.2.2` is a stabilization release for the `v0.2.x` diagnosis model.

It does not change the product shape. It tightens diagnosis quality, improves routing guidance for agent skills, and refreshes the release-facing docs around the stable `v0.2.x` surface.

## Highlights

- tightened `diagnose hmr` websocket handling so ambiguous runtime snapshots do not overclaim failure on their own
- prioritized diagnosis output so stronger `fail` results appear ahead of weaker `warn` items
- added regression tests for websocket ambiguity handling and diagnosis ordering
- expanded skill routing guidance across `core-debug`, `runtime-diagnostics`, `network-regression`, and `release-smoke`
- updated README and launch copy to position `v0.2.2` as the stable patch release for the current diagnosis model

## Validation

Release validation completed with:

- `pnpm typecheck`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm test:evals`
- `pnpm build`
- `pnpm test:evals:e2e`
- `npm pack --dry-run`

## Notes

`v0.2.2` remains a `v0.2` release. It is strong at event correlation, HMR diagnosis, and first-pass runtime triage, but it is not yet the propagation-trace release planned for `v0.3.0`.
