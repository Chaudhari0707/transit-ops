# Tests

Unit and integration tests for transit-ops. See `.agents/testing-standards.md` for conventions.

## Layout

```text
test/
  modules/<domain>/     # Mirrors src/modules/<domain>/
  lib/                  # Shared utility tests
```

## Rules

- Never place tests inside `src/`
- Failure-first: write failure/edge tests before happy-path tests for new APIs
- Run: `bun run test:unit`

E2E browser tests live in `playwright/` — see `docs/testing.md`.

## Getting started

When implementing a new module under `src/modules/<domain>/`, create matching tests:

```text
test/modules/<domain>/<feature>-rules.test.ts
```
