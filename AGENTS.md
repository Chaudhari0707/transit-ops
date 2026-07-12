> Non-standard Next.js — read `.agents/nextjs.md` before any Next.js code.
> Domain rules index → `.agents/index.md`

# Agent Policy

## Architecture

- **Plug-in-play modules:** major features ship as isolated plug-ins under `src/modules/<domain>/plugins/<feature>/` with a manifest + `index.ts` / `server.ts` public surface. Read `.agents/modular-plugins.md` before any new cross-cutting capability.
- DRY + reusability are core. Search for existing modules, hooks, utilities, and schemas before creating new ones.
- `page.tsx` = orchestration only → extract to `_components/*-page-client.tsx`.
- Form schemas → `_lib/*-schema.ts`. Transforms → `_lib/*-helpers.ts`.
- Route-specific extractions → colocate under `src/app/<route>/_components` and `src/app/<route>/_types`.
- Arch/API/schema changes → update `docs/` + nearest `AGENTS.md` in the same task.
- **New APIs (mandatory):** follow `.agents/api-standards.md` — module layout, TypeBox models, error map, auth/ownership, and **failure-first** tests under `test/modules/**`. Never ship happy-path-only API tests.

## Hard gates (do not regress)

These failed pre-commit in production. **Never reintroduce them.**

### Exported types location (`local/no-exported-types-in-source`)

- **Never** `export type` / `export interface` from runtime source files (`_lib/`, `index.ts`, `service.ts`, `model.ts`, components, pages).
- **Always** put exported types in a colocated `_types/` directory (e.g. `src/lib/auth/_types/…`, `src/modules/<domain>/_types/…`, `src/app/<route>/_types/…`).
- Runtime modules **import** types from `_types/`; they do not re-export them.
- Type declarations in `_types/` must stay alphabetically ordered (`local/sort-types-and-keys`).

### Elysia HTTP errors (`typecheck` + real status codes)

- **Never** return `new Response(JSON.stringify(…), { status })` from Elysia route handlers for domain errors. That infers `Promise<Response | T>` and **fails `tsc`**, and string status codes have also returned HTTP 200.
- **Always** use context `status(numericCode, { message })` with **explicit** numeric branches (`status(401, …)`, `status(403, …)`, …) — copy `src/modules/drivers/index.ts` / `src/modules/vehicles/index.ts`.
- Prefer `errorMessage` + `resolveErrorCodeNumber` then `if (code === 401) return status(401, …)` (not a single `status(resolveErrorCode(…))` call that widens to string codes and breaks SelectiveStatus).
- Service throws: use shared messages from `src/lib/api/http-errors.ts` (`UNAUTHORIZED_MESSAGE`, `FORBIDDEN_MESSAGE`); `resolveErrorCode*` still maps legacy `"Unauthorized"` / `"Forbidden"` and friendly phrases.
- Run `bun run typecheck` on any controller change before claiming done.

### Auth UX / RBAC (dashboard)

- Dashboard and domain app routes are gated by `src/proxy.ts` + `requirePageSession` — **do not** embed `LoginForm` or soft-navigate into a sign-in UI inside the app shell.
- Sidebar nav is role-filtered via `src/lib/auth/_lib/sidebar-nav.ts` (RBAC matrix). Do not hardcode full nav for every role.
- On 401 in page clients: toast session-expired + hard `window.location.assign("/sign-in")`. On 403: user-facing copy via `toUserFacingApiError`, never raw `"Forbidden"`.

## Authentication

- **Better Auth only** for all sign-in, sessions, roles, and route protection. Read `.agents/auth.md` before any auth work.
- **Better Auth MCP (`better-auth`):** consult `search_docs` + `get_doc` for official docs **before** writing or changing auth code — do not guess APIs from training data.
- Elysia domain APIs consume Better Auth sessions — do not add parallel auth systems.

## Linear sync (MCP)

- Use the **Linear MCP server** (`linear`) to keep tickets in sync with code.
- When work maps to a Linear issue: read it at start, move to in-progress while working, mark **Done** + leave a completion comment **before handoff**.
- See `.agents/linear-sync.md` for the full MCP workflow (`list_issues`, `get_issue`, `save_issue`, `save_comment`).

## Clarification

- Use `askQuestions` when the request is ambiguous, multi-module, or acceptance criteria are unclear.
- Do not invent missing business rules. State assumptions explicitly when proceeding.
- If no Linear issue exists for non-trivial work, ask whether to create one before proceeding.

## Execution

- Stay scoped. Fix root causes. No speculative refactors.
- **Tooling:** pure Oxc — `oxfmt` for formatting, `oxlint` for linting. No ESLint or Prettier.
- **Gates (blocking):** `fmt:check`, `lint` (0 warnings), `typecheck`, `file-size`, `build`.
- **Pre-commit:** `lint-staged` (oxfmt + oxlint) then `check:fast` (typecheck + test:unit + file-size).
- No gate bypasses (`oxlint-disable`, rule downgrades, allowlist additions) without explicit user approval.
- When file-size pressure appears, extract one responsibility at a time. Keep public interfaces stable.
- Validate touched slice → rerun full gates before concluding.
- Update linked Linear issues via MCP after completing work (same session, not as a follow-up).
- Load `.agents/skills/karpathy-guidelines/SKILL.md` for behavioral discipline on non-trivial work.
- **E2E:** Playwright specs under `playwright/`. Run `bun run test:e2e` for browser coverage. See `docs/testing.md`.

## Images

See `.agents/images.md` for `next/image` and SVG rules.
