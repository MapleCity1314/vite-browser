# Roadmap: v0.3.4 - v0.3.6+

**Focus**: Vite ecosystem only (including vite-rsc), no Next.js specific features.

## ✅ v0.3.4: Cross-Platform Performance & Vue Ecosystem — Shipped

**Goal**: Improve Windows and Linux stability, enhance Vue/Vue DevTools integration, and establish self-contained test infrastructure.

### Delivered

**Cross-Platform Path & Browser Handling**
- Enhanced `socketDir` creation with platform-specific temp directory fallback
- Improved PID file locking to avoid cross-platform race conditions
- Platform-specific Chromium launch args (Linux: `--disable-dev-shm-usage`, `--no-sandbox`)
- Centralized `isLinux` export in `paths.ts`

**Performance Optimizations**
- O(n²) → O(n) Set-based deduplication in Vue devtools
- Binary search insertion in `EventQueue` for O(log n) time-window queries
- Depth limit added to `formatComponentTree` to prevent stack overflow

**Self-Contained Test Infrastructure**
- Vue 3 + Pinia + Vue Router test fixture (`test/fixtures/vue-app/`)
- pnpm workspace integration for all fixtures
- Tests reorganized into `test/unit/`

**Code Quality**
- Consolidated duplicate `removeSocketFile` helper
- Unified `node:fs/promises` usage

---

## ✅ v0.3.5: Enhanced React Support — Shipped

**Goal**: Achieve React diagnostics depth comparable to Vue/Pinia support, focused on Vite ecosystem.

### Delivered

**1. Bundled React DevTools Hook** (commit cbf5a70)
- Internal minimal hook implementation — zero external dependency
- Removed `REACT_DEVTOOLS_EXTENSION` path requirement entirely
- Hook health checks and auto-injection on page load
- 7 tests

**2. Zustand State Management Support** (commit cb7a332)
- Store detection, listing, and inspection (`react store list / inspect`)
- Circular reference handling in state serialization
- 6 tests

**3. React Render Tracking & Profiling** (commit 7787397)
- React DevTools Profiler API integration
- Render phase/duration tracking
- Slow render detection (>16 ms threshold)
- 8 tests

**4. React 18 + Vite Test Fixture** (commit 36040a5)
- Self-contained React test app with Zustand and React Router
- pnpm workspace integration

**New CLI commands**
```bash
vite-browser react store list
vite-browser react store inspect <name>
```

---

## v0.3.6+: Future Work

**Goal**: Expand state management breadth and add vite-rsc support.

### Planned

**1. Redux / RTK Support**
- Detect Redux DevTools, read state and action history
- Correlate action dispatch with component renders

Files: `src/react/redux.ts`

**2. React Propagation Diagnosis**
- Implement `store → render → error` propagation analysis for React
- Track store subscriptions and component renders
- Analyze props flow through component tree
- Track `useEffect`/`useMemo`/`useCallback` dependency changes

New command:
```bash
vite-browser diagnose react-propagation --window 5000
```

Files: `src/diagnose-react-propagation.ts`

**3. vite-rsc Support**
- Detect vite-rsc runtime
- Track Server Component boundaries
- Monitor RSC payload streaming
- Correlate server/client state

Files: `src/vite-rsc/`

**4. Jotai / Valtio Support**
- Detect atom/selector updates
- Proxy-based state tracking

**5. Advanced Vue 3.5+ Features**
- `defineModel` and generic components support
- Composable state flow tracing
- Stale ref and reactive issue detection

---

## Development Principles

- **Vite-first**: All features must work with Vite dev server
- **Self-contained tests**: No external dependencies for test fixtures
- **Incremental commits**: Commit after each completed feature, verify before moving on
- **Quality gates**: Run `pnpm test` and `pnpm typecheck` before every commit
- **Cross-platform**: Test on Windows, Linux, and macOS
- **Zero-config**: Maintain the core philosophy of no project setup required

---

## Verification Checklist (per feature)

Before committing each feature:
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] Manual testing on current platform
- [ ] Code follows existing patterns
- [ ] No external test dependencies introduced
- [ ] Documentation updated if needed
- [ ] Git commit with clear message
