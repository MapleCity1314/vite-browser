## vite-browser

When the task is about debugging a Vite app, runtime behavior after a recent edit,
HMR or reload regressions, wrong data from the UI, or release smoke checks, use
the checked-in `vite-browser` skills in `skills/`.

Routing:
- Start with `skills/SKILL.md`
- Use `vite-browser-runtime-diagnostics` for HMR, reload, module, or import failures
- Use `vite-browser-network-regression` for request, auth, CORS, or payload issues
- Use `vite-browser-release-smoke` for pre-merge or pre-release checks
- Use `vite-browser-core-debug` only for broad first-pass triage
