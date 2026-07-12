## Component Agent Policy

```xml
	<frontendPolicy>
	<frontend>
		<compositionRule required="true">Prefer composing existing project components and UI primitives before introducing custom patterns.</compositionRule>
		<sharedInteractionRule required="true">Recurring app-wide interactions belong in src/components/ui and should be reused instead of reimplemented in route files.</sharedInteractionRule>
		<affordanceRule required="true">Clickable controls should preserve obvious pointer affordance in their default state.</affordanceRule>
		<dialogRules required="true">
			<rule>Dialog actions belong in a sticky footer action area.</rule>
			<rule>Keep primary and secondary dialog actions anchored in the footer.</rule>
		</dialogRules>
		<formRules required="true">
			<rule>Reusable form controls must set aria-invalid on the focusable control, not only a wrapper.</rule>
			<rule>Custom controls must forward refs/focus so RHF can focus the first invalid field on submit.</rule>
			<rule>Extract shared RHF field wrappers when a route repeats the same label/control/error pattern.</rule>
		</formRules>
	</frontend>
	</frontendPolicy>
```

Load `.agents/skills/vercel-composition-patterns/SKILL.md` before creating or refactoring shared components.
