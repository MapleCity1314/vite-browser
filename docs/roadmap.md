# Roadmap: v0.3.4 - v0.3.5+

**Focus**: Vite ecosystem only (including vite-rsc), no Next.js specific features.

## v0.3.4: Cross-Platform Performance & Vue Ecosystem

**Goal**: Improve Windows and Linux stability, enhance Vue/Vue DevTools integration, and establish self-contained test infrastructure.

### Priority 1: Vue & Vue DevTools Ecosystem Enhancement

**1. Vue DevTools Integration Improvements**
- Enhance Vue 3 component tree inspection reliability
- Improve Pinia store state tracking and mutation history
- Better Vue Router integration (route guards, navigation history)
- Support Vue 3.4+ features (defineModel, generic components)
- Optimize devtools hook injection timing

Files: `src/vue/devtools.ts`, `src/browser-frameworks.ts`, `src/browser-collector.ts`

**2. Vue-Specific Event Collection**
- Track Vue lifecycle hooks (onMounted, onUpdated, etc.)
- Record computed property dependencies
- Capture watcher triggers and effects
- Improve reactivity system introspection

Files: `src/browser-collector.ts`, `src/event-queue.ts`

**3. Vue Propagation Diagnosis Enhancement**
- Refine Pinia store → component propagation analysis
- Track composable state flow
- Identify stale refs and reactive issues
- Better confidence scoring for Vue patterns

Files: `src/diagnose-propagation.ts`, `src/trace.ts`, `src/correlate.ts`

### Priority 2: Self-Contained Test Infrastructure

**Current Issue**: Tests depend on external projects, making CI/CD fragile.

**Solution**: Create internal test fixtures as pnpm workspace projects.

**Test Workspace Structure**:
```
test/
├── fixtures/
│   ├── vue-app/          # Vue 3 + Vite + Pinia test app
│   ├── react-app/        # React 18 + Vite test app
│   ├── svelte-app/       # Svelte 4 + Vite test app
│   └── vite-rsc-app/     # vite-rsc test app (future)
├── unit/                 # Unit tests (moved from test/*.test.ts)
├── integration/          # Integration tests
└── e2e/                  # E2E tests using fixtures

pnpm-workspace.yaml       # Add test/fixtures/*
```

**Implementation**:
- Create minimal Vite apps in `test/fixtures/` with known behaviors
- Configure `.gitignore` to exclude `node_modules` and build outputs in fixtures
- Update test imports to use local fixtures instead of external repos
- Ensure fixtures are lightweight and fast to install

Files: `pnpm-workspace.yaml`, `test/fixtures/*/package.json`, `.gitignore`

### Priority 3: Cross-Platform Path & Browser Handling

**1. Platform-Specific Path Handling**
- Enhance socket directory creation with Windows permissions handling
- Add platform-specific temp directory fallback (`%TEMP%` on Windows, `/tmp` on Linux)
- Improve PID file locking to avoid cross-platform race conditions
- Add Windows named pipe connection timeout and retry logic

Files: `src/paths.ts`, `src/daemon.ts`, `src/client.ts`

**2. Playwright Browser Launch Optimization**
- Add platform-specific Chromium launch args:
  - Windows: `--no-sandbox`, `--disable-gpu` (optional)
  - Linux: `--disable-dev-shm-usage`, `--no-sandbox` (Docker)
- Improve React DevTools extension path resolution:
  - Support absolute/relative paths in `REACT_DEVTOOLS_EXTENSION`
  - Auto-detect common install locations (npm/pnpm/yarn global)
  - Provide clear installation guidance when extension is missing
- Optimize browser context startup timeout and error recovery

Files: `src/browser-session.ts`, `src/browser.ts`

### Priority 4: Performance Optimizations

**1. Event Queue Performance**
- Optimize time window queries (O(n) → O(log n) with binary search)
- Add event type indexing for faster `ofType` queries
- Benchmark and validate performance improvements

Files: `src/event-queue.ts`, `test/unit/event-queue.test.ts`

**2. Source Map Caching**
- Add LRU cache for source map parsing results
- Reduce redundant network requests and file reads
- Add cache hit/miss metrics

Files: `src/sourcemap.ts`, `test/unit/sourcemap.test.ts`

### Priority 5: Testing & CI

**1. Test Organization**
- Move existing tests to `test/unit/`
- Create integration tests using local fixtures
- Add platform-specific tests
- Ensure all tests pass with `pnpm test`

**2. CI Workflows**
- Add Windows CI workflow (GitHub Actions)
- Add Linux CI workflow (GitHub Actions)
- Ensure macOS CI continues to work
- Run tests against all platforms on every PR

Files: `.github/workflows/test-{windows,linux,macos}.yml`

---

## v0.3.5+: Enhanced React Support (Vite-focused)

**Goal**: Achieve React diagnostics depth comparable to Vue/Pinia support, focused on Vite ecosystem.

### Core Features

**1. Improved React DevTools Integration**
- Bundle React DevTools Hook internally (MIT compatible)
- Remove dependency on external extension path → zero-config setup
- Add hook health checks and auto-reinjection
- Improve bridge communication with timeout/retry
- Support React 18+ concurrent features

Files: `src/react/devtools.ts`, `src/react/hook.js` (new), `src/browser-session.ts`

**2. React State Management Support (Vite-compatible)**
- **Zustand**: Detect stores, track updates/subscribers, format state output
- **Redux/RTK**: Detect Redux DevTools, read state/action history, correlate actions with renders
- **Jotai**: Track atom updates and dependencies (Vite-friendly)
- **Valtio**: Proxy-based state tracking

New commands:
```bash
vite-browser react store list
vite-browser react store inspect <name>
vite-browser react store trace <name>
```

Files: `src/react/stores.ts`, `src/react/zustand.ts`, `src/react/redux.ts` (new)

**3. Enhanced Render Tracking**
- Integrate React DevTools Profiler API
- Record render trigger reasons (props/state/hooks/parent)
- Record render duration and detect slow renders
- Track Suspense boundaries and Transitions
- Detect concurrent rendering conflicts

Files: `src/browser-collector.ts`, `src/react/profiler.ts` (new)

**4. React Propagation Diagnosis**
- Implement `store → render → error` propagation analysis
- Track store subscriptions and component renders
- Analyze props flow through component tree
- Track useEffect/useMemo/useCallback dependency changes

New command:
```bash
vite-browser diagnose react-propagation --window 5000
```

Files: `src/diagnose-react-propagation.ts` (new), `src/correlate.ts`, `src/trace.ts`

**5. vite-rsc Support (Future)**
- Detect vite-rsc runtime
- Track Server Component boundaries
- Monitor RSC payload streaming
- Correlate server/client state

Files: `src/vite-rsc/` (new directory)

---

## Release Timeline

**v0.3.4** (6 weeks)
- Week 1: Test infrastructure setup (fixtures, workspace, gitignore)
- Week 2: Vue DevTools enhancements and Vue-specific event collection
- Week 3: Cross-platform path and browser handling
- Week 4: Performance optimizations (event queue, source map cache)
- Week 5: CI workflows and platform testing
- Week 6: Integration testing, bug fixes, and commits (no release yet)

**v0.3.5** (8-10 weeks)
- Weeks 1-2: React DevTools integration and bundled hook
- Weeks 3-4: Zustand, Redux, Jotai support
- Weeks 5-6: Render tracking and performance analysis
- Weeks 7-8: React propagation diagnosis
- Weeks 9-10: Testing, documentation, and release

**v0.3.6+** (Future)
- vite-rsc support
- Valtio state management
- Advanced Vue 3.5+ features
- Performance profiling tools

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
