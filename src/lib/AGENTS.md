## Backend Agent Policy (Elysia Client, Auth & Shared Lib)

```xml
	<backendPolicy addon="elysia">
	<skillUsage>
		<rule required="true">When editing Elysia client integration code here, load and follow the ElysiaJS skill before implementation.</rule>
	</skillUsage>

	<backend>
		<frameworkRule required="true" framework="elysiajs">Keep Elysia client wiring consistent with the server contract.</frameworkRule>
		<apiDesignRule required="true">Preserve type-safe client and server integration points.</apiDesignRule>
		<authRule required="true">All authentication lives in src/lib/auth/ using Better Auth. Follow `.agents/auth.md`. Consult Better Auth MCP (`search_docs`, `get_doc`) before any auth change.</authRule>
		<schemaRule required="true">When schema files under src/lib/db change, update the related scripts in scripts/ during the same task. Better Auth tables must stay aligned with better-auth.ts adapter mapping.</schemaRule>
		<documentationRule required="true">For core database or auth architecture changes, update docs/architecture/* and add concise scoped AGENTS.md guidance when future agents need a durable rule.</documentationRule>
	</backend>
	</backendPolicy>
```

See also: [`.agents/auth.md`](../../.agents/auth.md)
