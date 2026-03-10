# vite-browser v0.3.1

## Summary

`v0.3.1` is a stabilization patch for the `v0.3` release line.

It improves the practical debugging loop for live Vite runtime failures by capturing browser-side runtime errors even when the Vite overlay is absent, preserving event collection more reliably across reloads, and cleaning up direct CLI execution.

## Highlights

- added runtime-error fallback for `vite-browser errors`
- capture browser `pageerror` events and Vue unhandled-render warnings as structured runtime errors
- keep browser-side event collection installed across reloads via init-script registration
- improved live propagation repros when store updates and render failures happen in a short event window
- removed the direct CLI entrypoint warning caused by unsettled top-level await usage

## Validation

Release validation completed with:

- `pnpm typecheck`
- `pnpm build`
- `pnpm vitest run test/browser-runtime.test.ts test/daemon-core.test.ts test/browser-core.test.ts`
- `pnpm vitest run test/cli-core.test.ts test/cli-routing.test.ts test/cli-smoke.test.ts`
- live manual validation against the local demo:
  - `errors --mapped --inline-source`
  - `logs`
  - `correlate renders --window 5000`
  - `diagnose propagation --window 5000`

## Notes

`v0.3.1` does not change the product model introduced in `v0.3.0`.

It is still correct to position `correlate renders` and `diagnose propagation` as high-confidence propagation clues with conservative fallback behavior when evidence is incomplete. The main patch-level improvement is that live runtime failures now surface much more reliably through the normal CLI flow.
