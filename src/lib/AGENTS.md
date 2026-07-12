## Backend Agent Policy (Elysia Client & Shared Lib)

```xml
	<backendPolicy addon="elysia">
	<skillUsage>
		<rule required="true">When editing Elysia client integration code here, load and follow the ElysiaJS skill before implementation.</rule>
	</skillUsage>

	<backend>
		<frameworkRule required="true" framework="elysiajs">Keep Elysia client wiring consistent with the server contract.</frameworkRule>
		<apiDesignRule required="true">Preserve type-safe client and server integration points.</apiDesignRule>
		<schemaRule required="true">When schema files under src/lib/db change, update the related scripts in scripts/ during the same task.</schemaRule>
		<documentationRule required="true">For core database architecture changes, update docs/architecture/* and add concise scoped AGENTS.md guidance when future agents need a durable rule.</documentationRule>
	</backend>
	</backendPolicy>
```
