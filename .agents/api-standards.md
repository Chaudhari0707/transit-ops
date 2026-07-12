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

```typescript
export const fooModule = new Elysia({ name: "foo", prefix: "/foo" }).post(
  "/",
  async ({ body, status }) => {
    try {
      const result = await FooService.doThing(body);
      return result;
    } catch (error) {
      const message = errorMessage(error, "Unable to …");
      return status(resolveErrorCode(message), { message });
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

### HTTP status map

| Message pattern           | Code |
| ------------------------- | ---- |
| `Unauthorized`            | 401  |
| `Forbidden`               | 403  |
| ends with `not found` (i) | 404  |
| `Conflict`                | 409  |
| `Too many requests`       | 429  |
| everything else           | 400  |

---

## 3. Model contract (`model.ts`)

- Export runtime `XxxModel` object with `errorResponse`, body, response schemas
- Export **types** from `_types/` — not from `model.ts`
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
