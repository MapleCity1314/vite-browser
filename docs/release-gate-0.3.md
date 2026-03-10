# vite-browser v0.3 Release Gate

This checklist defines the minimum bar for shipping `v0.3.0`.

`v0.3` is the propagation-diagnostics release line. It should improve how `vite-browser` narrows likely update paths into rerenders, network work, and visible failures, without claiming strict causal proof across arbitrary component graphs.

## Product Positioning

These points must stay true everywhere `v0.3` is described:

- `correlate renders` and `diagnose propagation` provide high-confidence propagation clues.
- They do not claim full component-graph causality.
- When evidence is incomplete, output must stay conservative.
- When no render/update trace exists, output must say so explicitly.

Status:
- `README.md`: covered
- `docs/launch-kit.md`: covered
- `skills/vite-browser-runtime-diagnostics/SKILL.md`: covered

## Required Functional Surface

These user-facing capabilities must work before release:

- `vite-browser correlate renders`
- `vite-browser diagnose propagation`
- Vue-first store update collection
- top-level `changedKeys` reporting for store updates
- render path output for propagation summaries
- conservative fallback output when propagation evidence is weak

Status:
- Implemented in current branch

## Required Validation

The following checks must pass for a `v0.3` release candidate:

- `pnpm typecheck`
- `pnpm test`
- `pnpm test:evals`
- `pnpm build`
- `pnpm test:evals:e2e`

Status:
- `typecheck`: passed
- focused unit/integration suites: passed
- focused evals: passed
- full `pnpm test`: passed
- full `pnpm test:evals`: passed
- `pnpm build`: passed
- `pnpm test:evals:e2e`: passed

## Required Evals

`v0.3` should not ship unless these scenarios are represented:

- store -> render -> runtime error
- render -> repeated network work
- propagation evidence exists but is inconclusive
- no propagation trace exists

Status:
- covered by `test/evals/eval-propagation-diagnosis.test.ts`

## Required E2E

At least one real app flow should validate propagation commands against a live Vite demo:

- open demo app
- trigger a real Pinia store update
- confirm `correlate renders` returns store/render evidence
- confirm `diagnose propagation` returns one of:
  - store -> render -> error
  - repeated network work
  - conservative inconclusive output

Status:
- covered by `test/evals-e2e/runtime-tools.e2e.test.ts`

## Nice-To-Have Before v0.3.0

These are useful, but should not block release if the required items are green:

- additional e2e around non-Vue downgrade behavior
- more explicit release notes for propagation examples
- stronger CI ergonomics around e2e demo startup

## Do Not Block v0.3.0 On

These belong to later iterations unless they become necessary to fix correctness:

- deep nested diffing for store mutations
- full consumer graph inference
- arbitrary multi-hop component causality
- React/Svelte propagation parity with Vue

## Ship Decision

Use this rule:

- Ship `v0.3.0-beta` if the required functional surface and required evals/e2e are green, but full release validation is still incomplete.
- Ship `v0.3.0` only after the required validation commands have been run cleanly on the release candidate state.

Current release-candidate state:

- The `v0.3.3` release-candidate checks above are green on the current working tree.
- `pnpm build`: passed
- `pnpm test`: passed
- `pnpm test:evals:e2e`: passed in the current local environment
- The tracked in-repo demo covers the baseline e2e path.
- An optional local-only `demo-gif` repro is also used to stress the stronger `source -> render -> error` path and browser-session recovery, but it is not part of the repository release payload.
