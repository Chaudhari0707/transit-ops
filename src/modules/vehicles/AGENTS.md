# Vehicles module (ODO-22)

- Mounted at `/api/vehicles` via `vehiclesModule`.
- RBAC: Fleet Manager write; Dispatcher + Financial Analyst view; Safety Officer **Forbidden**.
- Registry API may set status to `retired` only; `on_trip` / `in_shop` are owned by trip/maintenance modules.
- Retire and soft-delete are blocked while status is `on_trip`.
- Soft-delete uses `deleted_at`; list/get always exclude deleted rows.
- Filters: `vehicleTypeId`, `status` only (no region).
- UI: `/dashboard/vehicles` (ODO-23). Full contract: `docs/architecture/09-vehicles-api.md`.

## Controller errors (do not regress)

- `index.ts` **must** use Elysia `status(numeric, { message })` with explicit `401`/`403`/`404`/`409`/`429`/`400` branches (same as drivers).
- **Do not** reintroduce `new Response(JSON.stringify(...), { status })` — breaks `bun run typecheck` (`Promise<Response | VehicleRecord>`).
- Full rule: `.agents/api-standards.md` §2 + root `Agents.md` → “Hard gates”.
