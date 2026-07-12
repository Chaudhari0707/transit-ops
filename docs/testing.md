# Testing Reference

This codebase uses four kinds of verification:

- **Formatting:** `bun run fmt:check` (oxfmt)
- **Linting:** `bun run lint` (oxlint + custom rules)
- **Unit tests:** Bun test runner under `test/`
- **E2E browser tests:** Playwright specs under `playwright/`

## Quality gates

| Gate | Command              | When         |
| ---- | -------------------- | ------------ |
| Fast | `bun run check:fast` | Pre-commit   |
| Full | `bun run check`      | Before merge |

## Unit tests

```bash
bun run test:unit
bun test test/modules/auth
```

See `.agents/testing-standards.md` for failure-first conventions.

## Playwright E2E

### Prerequisites

1. Copy `.env.example` → `.env.local` and set `DATABASE_URL` + auth credentials.
2. Run `bun run db:seed` and `bun run auth:register-admin` for authenticated specs.
3. Run `bun run test:e2e:install` once to install Chromium.
4. Set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001` (default in `.env.example`).

### Projects

| Project                            | Specs              | Requires DB        |
| ---------------------------------- | ------------------ | ------------------ |
| `chromium`                         | `smoke.spec.ts`    | No                 |
| `setup` + `chromium-authenticated` | `auth-api.spec.ts` | Yes (seeded admin) |

### Runbook

```bash
bun run test:e2e                              # all specs
bun run test:e2e -- playwright/smoke.spec.ts
bun run test:e2e:headed                       # visible browser
bunx --bun playwright show-report             # HTML report
```

The Playwright config starts the dev server on port `3001` unless `PLAYWRIGHT_BASE_URL` points at an existing server.
