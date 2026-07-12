# Dashboard vehicles UI (ODO-23)

- Route: `/dashboard/vehicles` — Fleet sidebar link.
- Write actions only when RSC session role is `fleet_manager`.
- Client validation in `_lib/vehicle-schema.ts`; API re-validates.
- Filters: type + status only (no region).
