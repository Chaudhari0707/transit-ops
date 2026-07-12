# 05 — RBAC Matrix (Locked)

**Source of truth:** Product mockup (screenshot) + clarification answers (2026-07-12).

PDF persona “Driver” = app role **`dispatcher`**. Field **`drivers`** are fleet profiles, not this role.

## Legend

| Symbol   | Meaning                                                                                             |
| -------- | --------------------------------------------------------------------------------------------------- |
| **✓**    | Full module access (create/read/update as makes sense for domain; no hard-delete of completed logs) |
| **view** | Read-only                                                                                           |
| **—**    | No access (hide nav + deny API)                                                                     |
| **edit** | Update existing records (Safety on drivers)                                                         |

## High-level matrix (mockup)

| Role                  | Fleet (Vehicles) | Drivers  | Trips | Fuel / Expense | Analytics |
| --------------------- | ---------------- | -------- | ----- | -------------- | --------- |
| **Fleet Manager**     | ✓                | ✓        | —     | —              | ✓         |
| **Dispatcher**        | view             | —        | ✓     | —              | —         |
| **Safety Officer**    | —                | ✓ (edit) | view  | —              | —         |
| **Financial Analyst** | view             | —        | —     | ✓              | ✓         |

## Extended modules (clarified; not on original sketch)

| Role                  | Maintenance          | Dashboard KPIs | Master data | Users           | Documents      | Notifications                  |
| --------------------- | -------------------- | -------------- | ----------- | --------------- | -------------- | ------------------------------ |
| **Fleet Manager**     | ✓ write (open/close) | view           | ✓ CRUD      | ✓ create/manage | ✓ vehicle docs | view/manage outbox optional    |
| **Dispatcher**        | —                    | view           | —           | —               | —              | —                              |
| **Safety Officer**    | —                    | view           | —           | —               | —              | — (recipients of policy later) |
| **Financial Analyst** | **view costs only**  | view           | —           | —               | —              | —                              |

## Action-level detail

### Fleet Manager (`fleet_manager`)

- Vehicles: create, update, soft-delete, retire, list/filter
- Drivers: create, update, soft-delete (status changes except safety-score ownership can be shared — **Safety owns safety_score & suspend preferred**; Fleet Manager may still set initial status)
  - **Conflict resolve:** Safety Officer is authority for `safety_score`, `suspended` status, license fields; Fleet Manager creates drivers and may edit contact/name; both can read
- Maintenance: open/close, set cost/vendor/odometer fields
- Masters: regions, vehicle_types, license_categories, expense_categories, maintenance_types
- Users: create users, set role, activate/deactivate
- Analytics: utilization, costs (read), CSV
- **Cannot:** create/dispatch/complete trips; create fuel/expense rows

### Dispatcher (`dispatcher`)

- Vehicles: **view** only (for selection)
- Drivers: **no list manage**; may **read assignable drivers** via trip form API only (available + valid license) — not full driver admin
- Trips: create draft, edit draft, dispatch, complete, cancel
- On complete: enter end odometer, fuel liters, fuel cost → system writes `fuel_logs`
- Dashboard: view
- **Cannot:** maintenance write, expense/fuel manual screens, analytics deep reports, user admin

### Safety Officer (`safety_officer`)

- Drivers: edit compliance fields — license number/category/expiry, safety_score (0–100), suspend/unsuspend, contact
- Trips: **view** (monitor)
- Dashboard: view
- **Cannot:** vehicles, fuel/expense, trip mutations, masters, users

### Financial Analyst (`financial_analyst`)

- Vehicles: **view**
- Fuel logs: create/edit manual entries; see auto trip fuel logs
- Expenses: full create/edit
- Maintenance: **view cost fields** for reporting (no open/close)
- Analytics: operational cost, fuel efficiency, exports
- Dashboard: view
- **Cannot:** trip mutations, driver edits, vehicle writes, masters, users

## API enforcement policy

1. **Every mutating endpoint** checks role server-side (never UI-only).
2. Unauthorized → `403`.
3. Unauthenticated → `401`.
4. List endpoints must not leak forbidden modules’ sensitive fields beyond role (e.g. Safety doesn’t get expense totals APIs).

## Nav visibility (UI)

Match matrix: hide modules with **—**. Show view-only modules as read UI without write buttons.
