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
		<validationRule required="true">Do not rely on client-side form schemas for persisted mutations. Module paths must validate business invariants server-side before writing data.</validationRule>
		<documentationRule required="true">When service changes alter durable domain invariants or API contracts, update docs/architecture/* and scoped AGENTS.md in the same task.</documentationRule>
		<jobRule required="true">When a module has scheduler or reconciliation behavior, keep business logic in the module and expose only a thin entrypoint from scripts/.</jobRule>
	</backend>
	</backendPolicy>
```

See also: [`.agents/api-standards.md`](../../.agents/api-standards.md), [`.agents/testing-standards.md`](../../.agents/testing-standards.md)
