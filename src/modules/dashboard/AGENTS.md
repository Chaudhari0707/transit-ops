# Dashboard module (ODO-32 / ODO-33)

- Mounted at `/api/dashboard` via `dashboardModule`.
- **RBAC:** all authenticated roles can read (ADR-031).
- **KPIs (unfiltered):**
  - Active vehicles = non-retired (`available + on_trip + in_shop`)
  - Available / in maintenance (`in_shop`)
  - Active trips = `dispatched`; pending trips = `draft`
  - Drivers on duty = drivers with status `on_trip`
  - Fleet utilization % = `on_trip / (available + on_trip + in_shop) × 100`
  - Vehicle status breakdown for chart
- **Recent trips filters** (type + trip status only — **no region**): apply only to recent trips list, not KPIs.
- Recent trips default limit: **8**.
- UI: `/dashboard` — KPI cards, filters above recent trips, vehicle status chart (own height, not stretched to trips table).
