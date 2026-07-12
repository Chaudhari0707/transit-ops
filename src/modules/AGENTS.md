## Backend Agent Policy (Elysia Modules)

```xml
	<backendPolicy addon="elysia">
	<skillUsage>
		<rule required="true">When backend module work is involved, load and follow the ElysiaJS skill before implementation.</rule>
	</skillUsage>

	<backend>
		<frameworkRule required="true" framework="elysiajs">Keep backend modules aligned with ElysiaJS patterns and best practices.</frameworkRule>
		<apiDesignRule required="true">Keep backend changes modular, type-safe, and aligned with existing server patterns.</apiDesignRule>
		<apiStandardRule required="true">Every new or changed API MUST follow `.agents/api-standards.md`: module layout (index/model/service/_lib/_types), typed TypeBox models, error mapping, auth ownership, and failure-first tests under test/modules.</apiStandardRule>
		<testRule required="true">Do not ship a new API with happy-path-only tests. Write pure failure tests first for invalid inputs, auth/ownership failures, business-rule violations, and boundary values.</testRule>
		<structureRule required="true">Keep src/modules limited to runtime feature code (index.ts, service.ts, model.ts, _lib/, _types/). Do not place *.test.ts in src/modules; mirror tests under test/.</structureRule>
		<typesRule required="true">Never export type or interface from index.ts, service.ts, model.ts, or _lib/*. Put exported types only under _types/. Alphabetical order in _types/ (local/sort-types-and-keys).</typesRule>
		<errorHandlingRule required="true">Never return new Response(...) for domain errors in controllers. Always use context status with numeric codes and explicit if (code === 401) return status(401, { message }) branches. Canonical: drivers/index.ts and vehicles/index.ts. Run bun run typecheck after controller edits.</errorHandlingRule>
		<authRule required="true">Use Better Auth sessions in services (`auth.api.getSession`). Do not implement sign-in or custom cookie auth in modules. See `.agents/auth.md`.</authRule>
		<validationRule required="true">Do not rely on client-side form schemas for persisted mutations. Module paths must validate business invariants server-side before writing data.</validationRule>
		<documentationRule required="true">When service changes alter durable domain invariants or API contracts, update docs/architecture/* and scoped AGENTS.md in the same task.</documentationRule>
		<jobRule required="true">When a module has scheduler or reconciliation behavior, keep business logic in the module and expose only a thin entrypoint from scripts/.</jobRule>
	</backend>
	</backendPolicy>
```

### Controller anti-patterns (pre-commit killers)

```ts
// ❌ NEVER — fails typecheck (Response | T) and can send wrong HTTP status
return new Response(JSON.stringify({ message }), { status: code });

// ❌ NEVER — string status codes break SelectiveStatus / tsc on many routes
return status(resolveErrorCode(message), { message }); // resolveErrorCode → "401"

// ✅ ALWAYS — numeric status + explicit branches
const code = resolveErrorCodeNumber(message);
if (code === 401) return status(401, { message });
if (code === 403) return status(403, { message });
return status(400, { message });
```

```ts
// ❌ NEVER — lint: no-exported-types-in-source
// src/modules/foo/_lib/rules.ts
export type FooId = string;

// ✅ ALWAYS
// src/modules/foo/_types/foo.ts
export type FooId = string;
// _lib imports type only
```

See also: [`.agents/api-standards.md`](../../.agents/api-standards.md), [`.agents/testing-standards.md`](../../.agents/testing-standards.md)
