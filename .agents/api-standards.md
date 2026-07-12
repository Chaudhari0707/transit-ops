# API Standards (Mandatory for Every New API)

**Scope:** Any new or changed Elysia route under `src/modules/*` and mounted from `src/app/api/[[...slugs]]/route.ts`.

Agents **must** follow this document for every API. Do not invent ad-hoc shapes.

---

## 1. Module layout (required)

```text
src/modules/<domain>/
  index.ts          # Elysia controller only (HTTP, auth, status codes)
  model.ts          # TypeBox request/response schemas (runtime values only)
  service.ts        # Business logic (abstract class or plain functions)
  _lib/             # Pure helpers (validation, decisions, math)
  _types/           # Domain types (no exports from model.ts or service.ts)

test/modules/<domain>/
  <helper>.test.ts  # Pure rule tests (edge + failure first)
  <api-rules>.test.ts
```

Rules:

- **No** `*.test.ts` inside `src/modules`
- Mirror tests under top-level `test/`
- Keep `page.tsx` free of business logic; APIs own mutations

---

## 2. Controller contract (`index.ts`)

**Canonical pattern** (copy `src/modules/drivers/index.ts` or `src/modules/vehicles/index.ts`):

```typescript
import { errorMessage, resolveErrorCodeNumber } from "@/lib/api/errors";

function errorBody(message: string) {
  return { message };
}

export const fooModule = new Elysia({ name: "foo", prefix: "/foo" }).post(
  "/",
  async ({ body, status }) => {
    try {
      return await FooService.doThing(body);
    } catch (error) {
      const message = errorMessage(error, "Unable to …");
      const code = resolveErrorCodeNumber(message);
      // Explicit numeric branches — required for Elysia SelectiveStatus + tsc.
      if (code === 401) return status(401, errorBody(message));
      if (code === 403) return status(403, errorBody(message));
      if (code === 404) return status(404, errorBody(message));
      if (code === 409) return status(409, errorBody(message));
      if (code === 429) return status(429, errorBody(message));
      return status(400, errorBody(message));
    }
  },
  {
    body: FooModel.createBody,
    response: {
      200: FooModel.createResponse,
      400: FooModel.errorResponse,
      401: FooModel.errorResponse,
      403: FooModel.errorResponse,
      404: FooModel.errorResponse,
      409: FooModel.errorResponse,
      429: FooModel.errorResponse,
    },
  },
);
```

Required:

| Rule                            | Detail                                                    |
| ------------------------------- | --------------------------------------------------------- |
| Named module                    | `new Elysia({ name, prefix })`                            |
| Typed body/query/params         | Always via `model.ts` TypeBox                             |
| Typed responses                 | Include every status the handler returns                  |
| Auth                            | Enforce in service layer; never trust client role         |
| Errors                          | `throw new Error(message)` in service; map to HTTP status |
| No business logic in controller | Delegate to `*Service`                                    |

### Error handling — never regress (blocking)

| Do                                                          | Do **not**                                                                   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `return status(401, { message })` with **numeric** literals | `return new Response(JSON.stringify({ message }), { status: code })`         |
| Explicit `if (code === 401) return status(401, …)` branches | `status(resolveErrorCode(message), …)` alone (string codes break `tsc`)      |
| `resolveErrorCodeNumber` + narrow with `=== 401` etc.       | Rely on string `"401"` / `"403"` for domain API errors (HTTP can become 200) |
| List every error status in `response: { 400, 401, … }`      | Omit statuses the handler can return                                         |
| Pass `bun run typecheck` after any `index.ts` change        | Ship controllers that only look fine at runtime                              |

**Why:** Returning `Response` unions as `Promise<Response \| DomainType>` fails TypeScript (`tsc` / pre-commit). Non-numeric Elysia status values have been observed as HTTP 200.

### HTTP status map (service message → code)

| Message pattern (case-insensitive)                  | Code |
| --------------------------------------------------- | ---- |
| `Unauthorized` / session expired / not signed in    | 401  |
| `Forbidden` / do not have permission                | 403  |
| ends with `not found`                               | 404  |
| `Conflict` / `Conflict:…` / “already has an open …” | 409  |
| `Too many requests`                                 | 429  |
| everything else                                     | 400  |

Use `errorMessage` + `resolveErrorCodeNumber` from `src/lib/api/errors.ts`. Prefer shared user-facing constants from `src/lib/api/http-errors.ts` when throwing 401/403.

---

## 3. Model contract (`model.ts`)

- Export runtime `XxxModel` object with `errorResponse`, body, response schemas
- Export **types** from `_types/` — not from `model.ts`, `service.ts`, `index.ts`, or `_lib/*`
- `export type` / `export interface` outside `_types/` fails lint (`local/no-exported-types-in-source`) — pre-commit will reject
- Types in `_types/` must be alphabetically ordered (`local/sort-types-and-keys`)
- Use `t.String({ format: "uuid" })` for IDs where applicable
- `minLength` / `maxLength` / `minimum` / `maximum` on user input
- Optional nullable fields: `t.Optional(t.Union([t.String(), t.Null()]))`

---

## 4. Service contract (`service.ts`)

- `import "server-only"` when touching DB/secrets
- Validate **business invariants** again (never rely on client validation alone)
- Auth/role checks belong here, not in the controller
- Prefer pure `_lib` helpers for decisions so tests don't need DB

---

## 5. Testing contract (mandatory — failure-first)

See `.agents/testing-standards.md` for full detail.

Minimum bar before merging a new API: **pure failure tests green** for that domain's rules.

---

## 6. Mounting

1. Export from `src/modules/index.ts`
2. `.use(module)` in `src/app/api/[[...slugs]]/route.ts`
3. Prefer `PUT` for upsert, `POST` for create/action, `GET` for read, `DELETE` for remove

---

## 7. Security checklist (every mutation)

- [ ] Better Auth session required unless explicitly public (`.agents/auth.md`)
- [ ] Ownership check (user can only touch own resources)
- [ ] Role/permission check via Better Auth admin plugin + `permissions.ts`
- [ ] Server revalidates all business invariants before persistence
- [ ] Secrets never returned to client
- [ ] Rate limit on abuse-prone public endpoints

---

## 8. Documentation

When API contract or durable domain rules change:

- Update nearest `docs/architecture/*` for the affected domain
- Update scoped `AGENTS.md` with only the durable rule
- Update this file only when standards themselves change
