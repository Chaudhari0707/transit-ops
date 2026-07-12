# Testing Standards

**Scope:** Unit tests under `test/`, E2E browser tests under `playwright/`. API modules must have failure-first coverage before merge.

---

## 1. Layout

```text
test/
  modules/<domain>/          # Mirrors src/modules/<domain>/
    <helper>.test.ts       # Pure function / rule tests
    <service-rules>.test.ts
  lib/                       # Shared utility tests (when needed)
  README.md                  # This project's test conventions
```

Rules:

- **Never** place `*.test.ts` or `*.spec.ts` inside `src/`
- Mirror module paths: `src/modules/auth/service.ts` → `test/modules/auth/service-rules.test.ts`
- Use `bun test --isolate` (configured in `package.json`)

---

## 2. Failure-first (mandatory for APIs)

For **every** new API domain, write tests that prove the system **fails correctly** before happy-path tests:

1. Invalid / missing required fields
2. Unauthorized / forbidden cases
3. Business rule violations
4. Boundary values (0, negative, max+1, empty string, malformed IDs)
5. Idempotency / conflict outcomes where relevant

**Do not** ship APIs with only happy-path coverage.

```typescript
describe("sign-in failure modes", () => {
  test("rejects empty username", () => { ... });
  test("rejects empty password", () => { ... });
  test("rejects inactive admin", () => { ... });
});
```

---

## 3. Test layers

| Layer       | What to test                                               |
| ----------- | ---------------------------------------------------------- |
| Pure `_lib` | All param combinations that change outcome + failure modes |
| Service     | Auth + DB paths when feasible (mock or integration)        |
| HTTP        | Handler tests for critical auth/mutation paths when needed |

Prefer pure `_lib` tests — fast, no DB, no network.

---

## 4. Naming and structure

- File: `<feature>-rules.test.ts` or `<helper>.test.ts`
- Use `describe` blocks grouped by rule or function
- One assertion focus per test when practical
- Cast mocks with `as unknown as TargetType` — never `as any`

---

## 5. Running tests

```bash
bun run test:unit          # all tests under test/
bun test test/modules/auth # single domain
```

`test:unit` uses `--pass-with-no-tests` so the gate passes while `test/` is being built out. **Add real tests as domains are implemented** — do not rely on the pass-with-no-tests escape hatch indefinitely.

---

## 7. E2E browser tests (Playwright)

```text
playwright/
  smoke.spec.ts              # No-auth smoke tests (homepage shell)
  auth-api.spec.ts           # Authenticated API/session flows
  auth.setup.ts              # Creates reusable storage state
  support/                   # env, navigation, auth helpers
```

Rules:

- E2E specs live under `playwright/`, never inside `src/`
- Use `playwright/support/` for shared helpers — keep specs thin
- Smoke tests must run without DB; authenticated flows use `auth.setup.ts`
- Add E2E coverage for critical user journeys as routes are built
- Run: `bun run test:e2e` (see `docs/testing.md`)

---

## 8. Pre-commit and CI gates

| Gate | Command              | When                                                            |
| ---- | -------------------- | --------------------------------------------------------------- |
| Fast | `bun run check:fast` | Pre-commit (typecheck + test:unit + file-size)                  |
| Full | `bun run check`      | Before merge (lint + typecheck + test:unit + file-size + build) |
| E2E  | `bun run test:e2e`   | Before merge for UI/auth changes (manual until CI is added)     |
