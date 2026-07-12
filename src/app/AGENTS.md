## Frontend Agent Policy

### Route Architecture

- `page.tsx` = thin Server Component boundary — data fetch and layout only.
- Client orchestration → `_components/*-page-client.tsx`.
- Form schemas → `_lib/*-schema.ts`. Transforms and defaults → `_lib/*-helpers.ts`.
- Route-specific types → `_types/` (not exported from page or component files).
- Route-specific extractions → colocate under `src/app/<route>/_components` and `src/app/<route>/_types`.

### Form Validation & Error UX

See `.agents/validation.md` for full rules. Summary:

- Realtime validation (`mode: "onChange"`, `reValidateMode: "onChange"`, `shouldFocusError: true`).
- Client validation = UX only; server re-validates before persistence.
- `data-invalid` on `Field` wrappers, `aria-invalid` on controls.
- Extract reusable field components when the same pattern appears 3+ times.

### Data Tables / List Views

When building ops dashboards or admin list views:

- Extract column definitions to `_components/[entity]-columns.tsx`
- Extract table wrapper to `_components/[entity]-data-table.tsx`
- Keep entity-specific files under the route's `_components/` directory
- Shared table primitives belong in `src/components/ui/`

### Skills

- React performance → `.agents/skills/vercel-react-best-practices/SKILL.md`
- Component architecture → `.agents/skills/vercel-composition-patterns/SKILL.md`
- UI review → `.agents/skills/web-design-guidelines/SKILL.md`
