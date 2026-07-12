> Non-standard Next.js — read `.agents/nextjs.md` before any Next.js code.
> Domain rules index → `.agents/index.md`

# Agent Policy

## Architecture

- **Plug-in-play modules:** major features ship as isolated plug-ins under `src/modules/<domain>/plugins/<feature>/` with a manifest + `index.ts` / `server.ts` public surface. Read `.agents/modular-plugins.md` before any new cross-cutting capability.
- DRY + reusability are core. Search for existing modules, hooks, utilities, and schemas before creating new ones.
- `page.tsx` = orchestration only → extract to `_components/*-page-client.tsx`.
- Form schemas → `_lib/*-schema.ts`. Transforms → `_lib/*-helpers.ts`.
- Exported types → `_types/` directories (enforced by lint). Do not export types from runtime source files.
- Route-specific extractions → colocate under `src/app/<route>/_components` and `src/app/<route>/_types`.
- Arch/API/schema changes → update `docs/` + nearest `AGENTS.md` in the same task.
- **New APIs (mandatory):** follow `.agents/api-standards.md` — module layout, TypeBox models, error map, auth/ownership, and **failure-first** tests under `test/modules/**`. Never ship happy-path-only API tests.

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
