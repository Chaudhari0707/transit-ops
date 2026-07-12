# 00 — Decision Log (ADRs)

Append-only style. Do not rewrite history; supersede with a new ADR row.

| ID      | Date       | Decision                | Choice                                                                              | Rationale                                                           |
| ------- | ---------- | ----------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| ADR-001 | 2026-07-12 | Tenancy                 | **Single organization**                                                             | Hackathon simplicity; no `org_id`                                   |
| ADR-002 | 2026-07-12 | Users vs Drivers        | **Separate tables**; `drivers.user_id` nullable unique                              | Dispatchers login; field drivers may not                            |
| ADR-003 | 2026-07-12 | Role cardinality        | **Exactly one role per user**                                                       | Simple RBAC column / enum on `users`                                |
| ADR-004 | 2026-07-12 | PDF “Driver” persona    | **App role = `dispatcher`**                                                         | PDF confuses field driver with dispatch persona                     |
| ADR-005 | 2026-07-12 | Roles set               | **`fleet_manager`, `dispatcher`, `safety_officer`, `financial_analyst`**            | No super-admin role; bootstrap via seed                             |
| ADR-006 | 2026-07-12 | Auth identity           | **Email + password**                                                                | Matches PDF; replaces scaffold username-primary login for app users |
| ADR-007 | 2026-07-12 | User provisioning       | **Seed scripts + Fleet Manager in-app user create**                                 | No admin role                                                       |
| ADR-008 | 2026-07-12 | Region model            | **Flat `regions` master**; trip has `source_region_id` + `destination_region_id`    | Dashboard region filter; no free-text source/dest                   |
| ADR-009 | 2026-07-12 | Lookups                 | **Master/config tables** (not fixed app-only consts)                                | Self-evolving config without code deploy for values                 |
| ADR-010 | 2026-07-12 | Status machines         | **Postgres ENUMs** for closed status sets                                           | Business rules need closed set; other types stay masters            |
| ADR-011 | 2026-07-12 | Soft delete             | **`deleted_at` on entities/masters**; logs largely immutable                        | Soft delete + timestamps only; no audit trail table                 |
| ADR-012 | 2026-07-12 | IDs                     | **UUID** public entities/masters; **bigserial** high-volume logs                    | Hybrid                                                              |
| ADR-013 | 2026-07-12 | Units / money           | **INR, km, kg, L**; `numeric(12,2)` money                                           | India-default fixed units                                           |
| ADR-014 | 2026-07-12 | Trip ends               | **Regions only** (no free-text locations v1)                                        | Product choice                                                      |
| ADR-015 | 2026-07-12 | Trip edit               | **Draft fully editable**; **Dispatched locked** except complete/cancel              | Clear lifecycle                                                     |
| ADR-016 | 2026-07-12 | Trip complete payload   | **final odometer + fuel liters + fuel cost INR**                                    | Auto-create `fuel_logs` row with `trip_id`                          |
| ADR-017 | 2026-07-12 | Odometer                | **Only on trip complete**; must be `>= vehicles.odometer_km`                        | Snapshot start at dispatch                                          |
| ADR-018 | 2026-07-12 | Fuel linkage            | **`fuel_logs.trip_id` optional**                                                    | Manual fuel allowed; trip complete auto-links                       |
| ADR-019 | 2026-07-12 | Cost split              | **Maintenance cost on `maintenance_logs`**; **expenses = non-maintenance**          | Avoid double-count in operational cost                              |
| ADR-020 | 2026-07-12 | Maintenance concurrency | **At most one open maintenance per vehicle**                                        | Status `in_shop` unambiguous                                        |
| ADR-021 | 2026-07-12 | Cancel trip             | **Draft or Dispatched only** (never Completed)                                      |                                                                     |
| ADR-022 | 2026-07-12 | Safety score            | **Manual 0–100** by Safety Officer                                                  | No auto-calc v1                                                     |
| ADR-023 | 2026-07-12 | License expiry          | **Block trip assign if `license_expiry_date < today`**                              | Hard compliance                                                     |
| ADR-024 | 2026-07-12 | Distance                | **`planned_distance_km` required**; actual = final − start odometer                 |                                                                     |
| ADR-025 | 2026-07-12 | Attachments             | **DB metadata + local/public upload path**                                          | Hackathon storage                                                   |
| ADR-026 | 2026-07-12 | Bonus entities          | **Include `documents` + `notification_outbox` in v1 schema design**                 | License reminders + vehicle docs                                    |
| ADR-027 | 2026-07-12 | ROI revenue             | **Deferred**                                                                        | See open questions                                                  |
| ADR-028 | 2026-07-12 | Docs truth              | **`docs/architecture` + Linear document both**; **repo docs win on conflict**       | Self-evolving foundation                                            |
| ADR-029 | 2026-07-12 | RBAC source             | **Product mockup matrix** (not “FM superuser”)                                      | See 05-rbac-matrix.md                                               |
| ADR-030 | 2026-07-12 | Maintenance RBAC        | **Fleet Manager write; Financial Analyst view costs**                               | Not on original sketch; clarified                                   |
| ADR-031 | 2026-07-12 | Dashboard               | **All authenticated roles read KPIs**                                               |                                                                     |
| ADR-032 | 2026-07-12 | Trip actions            | **Dispatcher only** for create/dispatch/complete/cancel                             |                                                                     |
| ADR-033 | 2026-07-12 | Master data CRUD        | **Fleet Manager only**                                                              |                                                                     |
| ADR-034 | 2026-07-12 | Fuel/Expense write      | **Financial Analyst full create/edit** (+ auto fuel on trip complete by Dispatcher) |                                                                     |

## Scaffold note (migration intent)

Current code has `admin_users` (username login). Architecture **replaces** that with multi-role `users` (email login). Implementation must migrate/remove `admin_users` when coding starts — not silently dual-run two auth systems.
