# 01 — System Overview

## Product

**TransitOps** — Smart Transport Operations Platform (Odoo hackathon, 8h).

Digitizes vehicle, driver, dispatch, maintenance, fuel, and expense management with enforced business rules and operational KPIs.

## Tenancy & deployment

| Concern  | Choice                                                                |
| -------- | --------------------------------------------------------------------- |
| Tenancy  | Single organization (one fleet company)                               |
| Database | Single PostgreSQL database                                            |
| API      | Next.js App Router + Elysia modules                                   |
| ORM      | Drizzle                                                               |
| Auth     | Email + password session/token (app-level); exactly one role per user |

## Fixed units (global constants — not DB columns)

| Quantity       | Unit                  |
| -------------- | --------------------- |
| Money          | INR (`numeric(12,2)`) |
| Distance       | kilometers            |
| Weight / cargo | kilograms             |
| Fuel volume    | liters                |
| Safety score   | integer 0–100         |

## Domain modules

1. **Auth & Users** — login, session, user CRUD (Fleet Manager)
2. **Master data** — regions, vehicle types, license categories, expense categories, maintenance types
3. **Fleet (Vehicles)** — registry + status
4. **Drivers** — profiles, license compliance, safety score
5. **Trips** — draft → dispatch → complete / cancel
6. **Maintenance** — open/close; vehicle In Shop
7. **Fuel & Expenses** — fuel logs + non-maintenance expenses
8. **Documents** — attachment metadata for vehicles (and maintenance)
9. **Notifications** — outbox for license expiry reminders
10. **Dashboard & Analytics** — KPIs, reports, CSV export (PDF optional)

## Entity map (logical)

```
users (role)
regions, vehicle_types, license_categories, expense_categories, maintenance_types
vehicles ──FK──► vehicle_types
drivers  ──FK──► license_categories
drivers.user_id? ──► users (optional)
trips ──► vehicles, drivers, regions×2, users(created_by)
maintenance_logs ──► vehicles, maintenance_types, users
fuel_logs ──► vehicles, trips?, users
expenses ──► vehicles, expense_categories, trips?, users
documents ──► polymorphic entity (vehicle | maintenance_log)
notification_outbox ──► drivers / users targets
```

## ID strategy

| Class                    | Tables                                                                                                                                            | PK                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Public / config entities | `users`, `regions`, `vehicle_types`, `license_categories`, `expense_categories`, `maintenance_types`, `vehicles`, `drivers`, `trips`, `documents` | `uuid` default random           |
| High-volume / log-like   | `fuel_logs`, `expenses`, `maintenance_logs`, `notification_outbox`                                                                                | `bigserial` / `bigint` identity |

## Soft delete policy

| Soft-delete (`deleted_at`)                                             | Immutable / no soft-delete (prefer cancel or compensating row)            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| users, vehicles, drivers, trips, regions, all master tables, documents | fuel_logs, expenses, maintenance_logs (once written), notification_outbox |

**Trips:** prefer status `cancelled` for dispatched work; soft-delete mainly for abandoned drafts if product needs hide-from-list.

## Naming conventions

- Tables: `snake_case` plural (`fuel_logs`)
- Columns: `snake_case`
- Booleans: `is_*` / `has_*`
- Timestamps: `*_at` with time zone
- Money: `*_inr` or clear `*_cost` with unit in docs
- Distances: `*_km`
- Weights: `*_kg`
- Volumes: `*_liters`

## Out of scope (v1)

- Multi-tenant orgs / branches hierarchy
- Full audit log / CDC
- Multi-currency
- Field-driver mobile app login (schema ready via `drivers.user_id` only)
- Billing/invoices & ROI revenue (deferred)
