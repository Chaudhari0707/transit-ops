# Authentication — Better Auth (Mandatory)

**All authentication and session work uses [Better Auth](https://www.better-auth.com/).** Do not add custom cookie/session auth, roll-your-own JWT flows, or parallel auth systems.

Elysia domain modules consume Better Auth sessions — they do not implement login themselves.

---

## Better Auth MCP (consult before every auth change)

Use the **Better Auth MCP server** (`better-auth`) to read official docs **before** writing or changing any auth-related code. Do not rely on training data for Better Auth APIs, plugins, or configuration.

| Tool          | When                                                                                 |
| ------------- | ------------------------------------------------------------------------------------ |
| `search_docs` | Find the right guide — plugins, Next.js integration, sessions, OAuth, errors         |
| `get_doc`     | Read the full page after `search_docs` returns a path (or browse index with no path) |

### Required workflow

1. **Before implementation** — `search_docs` with a specific query (e.g. `"drizzle adapter"`, `"admin plugin"`, `"nextjs middleware"`).
2. **Read full guide** — `get_doc(path="...")` for the matching path from search results. Do not guess paths.
3. **Implement** — match official config, plugin options, and API shapes from the doc.
4. **On errors** — `search_docs` with the error message or symptom, then `get_doc` for the fix.

### MCP usage rules

- Consult MCP **before** editing `src/lib/auth/**`, `src/app/api/auth/**`, auth schema, `proxy.ts`, or Playwright auth helpers.
- Prefer official docs over memory when plugin versions or Next.js integration details matter.
- Limit `search_docs` to **3 calls per task** — refine queries instead of repeating broad searches.
- If docs and local patterns conflict, follow official Better Auth docs and update local `AGENTS.md` only when the project intentionally diverges.

---

## Canonical layout

```text
src/lib/auth/
  better-auth.ts       # Server config (drizzle adapter, plugins, secret)
  auth-client.ts       # Client createAuthClient + plugins
  permissions.ts       # Access control roles (admin plugin)
  admin-route-access.ts  # Staff route guards (when needed)

src/app/api/auth/[...all]/route.ts   # toNextJsHandler(auth) — sole auth HTTP surface

src/proxy.ts           # Coarse session gate only (getSessionCookie)
```

---

## Rules

| Rule               | Detail                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| Single auth stack  | Better Auth only. No duplicate sign-in APIs in Elysia modules.                                            |
| Server config      | `src/lib/auth/better-auth.ts` with `drizzleAdapter`, `Bun.env` for secrets                                |
| Client             | `better-auth/react` client from `auth-client.ts` — never raw fetch to auth endpoints from UI              |
| Session in modules | `auth.api.getSession({ headers })` in services — not custom cookie parsing                                |
| Route protection   | `src/proxy.ts` (cookie only) + `requirePageSession` (DAL); no LoginForm inside app shell                  |
| Nav / page RBAC    | `src/lib/auth/_lib/sidebar-nav.ts` + `canAccessPageModule`; matrix: `docs/architecture/05-rbac-matrix.md` |
| 401 / 403 copy     | `src/lib/api/http-errors.ts` — user-facing messages; never raw `"Forbidden"` in UI toasts                 |
| Schema             | Better Auth tables (`user`, `session`, `account`, `verification`, etc.) in `src/lib/db/schema.ts`         |
| Env vars           | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS` — see `.env.example`               |
| E2E                | Playwright signs in via Better Auth UI (`playwright/support/better-auth.ts`)                              |
| Seeds              | `scripts/seed-better-auth-users.ts` for local test accounts                                               |
| Types              | Exported auth types only under `src/lib/auth/_types/` (lint: `no-exported-types-in-source`)               |

---

## Elysia + Better Auth boundary

- **Better Auth** owns: sign-in, sign-up, sessions, OAuth, magic link, 2FA, admin roles.
- **Elysia modules** (`src/app/api/[[...slugs]]/route.ts`) own: domain APIs (fleet, routes, ops).
- Domain services call `auth.api.getSession()` or shared `requireAuth` helpers — never re-implement password checks.

The legacy `src/modules/auth/` Elysia sign-in module is **transitional**. New auth features go in Better Auth config/plugins, not new Elysia auth routes.

---

## Security checklist

- [ ] `BETTER_AUTH_SECRET` set (never commit)
- [ ] `trustedOrigins` covers all dev/prod origins (avoids `state_mismatch`)
- [ ] Staff/admin routes check role via Better Auth admin plugin + `permissions.ts`
- [ ] Domain mutations verify session + ownership in service layer
- [ ] No secrets or session tokens returned in API responses

---

## Documentation

- **Official:** Better Auth MCP (`search_docs`, `get_doc`) — always consult before code changes.
- **Project:** Auth architecture changes → update `docs/architecture/auth.md` (create when migrating) and scoped `AGENTS.md` in the same task.
