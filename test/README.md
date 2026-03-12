# Test Structure

This directory contains all tests for vite-browser, organized into three categories:

## Directory Structure

```
test/
├── unit/              # Unit tests (fast, isolated, no external dependencies)
├── integration/       # Integration tests (use local fixtures)
├── fixtures/          # Self-contained test applications (pnpm workspace)
│   ├── vue-app/      # Vue 3 + Vite + Pinia
│   ├── react-app/    # React 18 + Vite (future)
│   └── svelte-app/   # Svelte 4 + Vite (future)
├── evals/            # Evaluation tests (legacy, to be migrated)
└── evals-e2e/        # E2E evaluation tests (legacy, to be migrated)
```

## Test Fixtures

Test fixtures are minimal Vite applications with known behaviors, used for integration and E2E testing. They are part of the pnpm workspace and can be installed with:

```bash
pnpm install
```

Each fixture is self-contained and does not depend on external repositories.

## Running Tests

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test test/unit

# Run integration tests
pnpm test test/integration

# Run with coverage
pnpm test:coverage

# Type checking
pnpm typecheck
```

## Writing Tests

- **Unit tests**: Test individual functions/modules in isolation. Mock external dependencies.
- **Integration tests**: Test multiple modules working together. Use local fixtures.
- **E2E tests**: Test the full CLI workflow against running fixture apps.

## Principles

- No external dependencies for test fixtures
- Fast test execution (unit tests < 1s, integration tests < 10s)
- Cross-platform compatibility (Windows, Linux, macOS)
- Clear test names and assertions
