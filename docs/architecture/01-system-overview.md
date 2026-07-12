# 01 — System Overview

## Product

**TransitOps** — Smart Transport Operations Platform (Odoo hackathon, 8h).

Digitizes vehicle, driver, dispatch, maintenance, fuel, and expense management with enforced business rules and operational KPIs.

**Canonical UI flow:** Excalidraw mockup (project share — not machine paths).

## Tenancy & deployment

| Concern  | Choice                                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Tenancy  | Single organization (one fleet company)                                                                                                |
| Database | Single PostgreSQL database                                                                                                             |
| API      | Next.js App Router + Elysia modules                                                                                                    |
| ORM      | Drizzle                                                                                                                                |
| Auth     | **Better Auth** — email/password; cookie sessions in DB `session`; role on user; **role dropdown on login UI** (validated server-side) |
| UI       | **shadcn only** — blocks first (`login-02`, `dashboard-01`, …), then components; **shadcn MCP first** (ADR-054)                        |

## Fixed units (global constants — not DB / no Settings module)

Hackathon: **no Settings screen**. Hardcode in app constants:

| Quantity       | Unit                  |
| -------------- | --------------------- |
| Money          | INR (`numeric(12,2)`) |
| Distance       | kilometers            |
| Weight / cargo | kilograms             |
| Fuel volume    | liters                |
| Safety score   | integer 0–100         |

## Domain modules (v1)

1. **Auth & Users** — Better Auth; login with email/password + role dropdown; Fleet Manager user provisioning; lockout after 5 failed sign-ins
2. **Master data** — vehicle types, license categories, expense categories, maintenance types (**no regions**)
3. **Fleet (Vehicles)** — registry + status
4. **Drivers** — profiles, license compliance, safety score; trip-completion % derived on the fly (not stored)
5. **Trips** — location FK source/destination (dropdown); complete = odometer + fuel_log + expenses + free vehicle/driver
6. **Locations** — logistics hubs for trip endpoints; seeded master list; fleet manager can add more
7. **Maintenance** — open/close; vehicle In Shop; costs roll into operational cost
8. **Fuel & Expenses** — fuel logs; toll/misc expenses; maintenance **linked in UI** (not double-stored as expense rows)
9. **Documents** — attachment metadata (ENV upload limits)
10. **Notifications** — outbox table; cron later
11. **Dashboard & Analytics** — KPIs; filters vehicle type + status only; CSV export; ROI/revenue **static placeholders**

## Entity map (logical)

```
Better Auth: user (+ role, is_active, …), session, account, verification, rateLimit?
vehicle_types, license_categories, expense_categories, maintenance_types
vehicles ──FK──► vehicle_types
drivers  ──FK──► license_categories
drivers.user_id? ──► user
locations
trips ──► vehicles, drivers, locations (source + destination), user(created_by)
maintenance_logs ──► vehicles, maintenance_types, user
fuel_logs ──► vehicles, trips?, user
expenses ──► vehicles, expense_categories, trips?, user   # toll/misc only
documents ──► vehicle | maintenance_log
notification_outbox ──► later worker
```

## ID strategy

| Class           | Tables                                                                                            | PK                            |
| --------------- | ------------------------------------------------------------------------------------------------- | ----------------------------- |
| Public / config | Better Auth `user` (+ session/account/verification), masters, vehicles, drivers, trips, documents | UUID / Better Auth string ids |
| Logs            | fuel_logs, expenses, maintenance_logs, notification_outbox                                        | bigserial                     |

## Soft delete

| Soft-delete                                                               | Immutable / library-managed                                                                          |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| vehicles, drivers, trips, masters, documents; user.is_active / deleted_at | fuel_logs, expenses, maintenance_logs, notification_outbox; Better Auth session/account/verification |

## Out of scope (v1 hackathon)

- Multi-tenant orgs
- Full audit log
- Multi-currency / Settings screen (static INR + km)
- **Regions table, region FKs, region dashboard filter** (cancelled)
- Driver **trip completion %** field
- Real **revenue / ROI** (static demo only; later task)
- Notification cron worker
- Field-driver mobile login (optional `drivers.user_id` only)
