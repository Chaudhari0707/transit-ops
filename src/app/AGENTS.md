## Frontend Agent Policy

### Route Architecture

- `page.tsx` = thin Server Component boundary — data fetch and layout only.
- Client orchestration → `_components/*-page-client.tsx`.
- Form schemas → `_lib/*-schema.ts`. Transforms and defaults → `_lib/*-helpers.ts`.
- Route-specific types → `_types/` (not exported from page or component files). **Never** `export type` from `_lib`, `_components`, or `page.tsx` — lint `no-exported-types-in-source`.
- Route-specific extractions → colocate under `src/app/<route>/_components` and `src/app/<route>/_types`.
- **Auth:** unauthenticated access is owned by `src/proxy.ts` + `requirePageSession`. Do not render `LoginForm` or soft-route to a sign-in UI inside dashboard/shell clients. Session expiry → toast + `window.location.assign("/sign-in")`.
- **RBAC UI:** filter sidebar via `canSeeNavItem` / `src/lib/auth/_lib/sidebar-nav.ts`. Gate pages with `canAccessPageModule` + `AccessDenied`. Do not show modules the role cannot use (see `docs/architecture/05-rbac-matrix.md`).

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

### Loading skeletons (tables & lists) — hard lessons

**Do not wrap HTML tables in `boneyard-js/react` `<Skeleton>`.**

`boneyard-js` `<Skeleton>` renders a **`<div>`**. A div cannot sit around only `<tbody>` without splitting the table into **two** tables (header table + body table). That caused:

1. Truncated column headers (`N`, `Lice`, `Catego`…)
2. Layout shift between loading and loaded
3. Whole cards/forms incorrectly skeletonized when the wrapper was too large

**Canonical pattern (Sardhar-style, used for Drivers/Vehicles/Documents/etc.):**

```tsx
<Card>
  <CardHeader>{/* title + description — always real UI */}</CardHeader>
  <CardContent>
    <Table>
      <TableHeader>{/* column headers — always real UI */}</TableHeader>
      <TableBody>
        {loading ? (
          <TableLoadingRows columnCount={N} rowCount={6} />
        ) : data.length === 0 ? (
          <EmptyRow />
        ) : (
          data.map(...)
        )}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

Rules:

1. **One** `<table>` for loading and loaded — same DOM shell → **zero layout shift**.
2. Always paint: page filters, forms (e.g. Add driver), **card chrome**, **table headers**.
3. Only **data cells / row content** show loading bars.
4. Use `TableLoadingRows` from `@/lib/boneyard/table-row-shimmer` (shimmer colors from `BONEYARD_RUNTIME` in `@/lib/boneyard/runtime-style` — same palette as boneyard config, **not** CSS `animate-pulse` alone).
5. **KPI / metric cards:** keep the **card + label** always real; shimmer **only the value** with `ValueShimmerBar` (e.g. Active Vehicles number). Never wrap the entire KPI card grid in a loading overlay.
6. **Never** put Add form / filters / titles inside a loading-only branch that unmounts them.
7. **Never** invent a separate “fallback skeleton layout” that is not the same table/card structure.

**Where full-block placeholders are OK:** chart panels / trip board tiles may shimmer the content region while the **card title / chrome** stays painted (see analytics chart panels, trips live board).

**Do not** use `@/components/ui/skeleton` for ops list tables when `TableLoadingRows` exists.

**Boneyard registry / CLI:** keep `BoneRegistryInit` + `src/bones/*` for any remaining named overlays; `bun run boneyard:build` for capture. Tables above no longer depend on per-route bone capture.

### Skills

- Boneyard / loading → this section first; then `.agents/skills/boneyard/SKILL.md` for CLI/API details
- React performance → `.agents/skills/vercel-react-best-practices/SKILL.md`
- Component architecture → `.agents/skills/vercel-composition-patterns/SKILL.md`
- UI review → `.agents/skills/web-design-guidelines/SKILL.md`
