# 05 — RBAC Matrix (Locked)

**Source:** Excalidraw Settings RBAC grid + product clarifications.  
PDF persona “Driver” = app role **`dispatcher`**.

## High-level matrix (mockup)

| Role                  | Fleet | Drivers | Trips | Fuel / Expense | Analytics |
| --------------------- | ----- | ------- | ----- | -------------- | --------- |
| **Fleet Manager**     | ✓     | ✓ full  | —     | —              | ✓         |
| **Dispatcher**        | view  | —\*     | ✓     | —              | —         |
| **Safety Officer**    | —     | ✓ full  | view  | —              | —         |
| **Financial Analyst** | view  | —       | —     | ✓              | ✓         |

\* Dispatcher reads **assignable** drivers only via trip form API.

## Extended modules

| Role                  | Maintenance | Dashboard                  | Master data | Users | Documents | Settings screen  | Notifications cron |
| --------------------- | ----------- | -------------------------- | ----------- | ----- | --------- | ---------------- | ------------------ |
| **Fleet Manager**     | ✓ write     | view (type+status filters) | ✓           | ✓     | ✓         | **Out of scope** | later              |
| **Dispatcher**        | —           | view                       | —           | —     | —         | —                | —                  |
| **Safety Officer**    | —           | view                       | —           | —     | —         | —                | —                  |
| **Financial Analyst** | view costs  | view                       | —           | —     | —         | —                | —                  |

Mockup login access notes (aligned):

- Fleet Manager → Fleet, Maintenance (+ analytics, users, masters)
- Dispatcher → Dashboard, Trips
- Safety Officer → Drivers, compliance (+ trip view)
- Financial Analyst → Fuel & Expenses, Analytics

## Action-level detail

### Fleet Manager

- Vehicles full CRUD/retire; drivers full edit; maintenance open/close; masters; users via Better Auth; analytics incl. **fuel+maintenance op cost**; documents.
- **Cannot:** trip lifecycle; manual fuel/expense writes.

### Dispatcher

- Vehicle view; trip full lifecycle; complete with odometer+fuel; dashboard.
- **Cannot:** driver admin, maintenance write, fuel/expense screens, analytics deep, users.

### Safety Officer

- Drivers full edit (same as FM on driver entity); trips view; dashboard.
- **Cannot:** fleet write, fuel/expense, trip mutations, masters, users.

### Financial Analyst

- Vehicle view; fuel logs full write; expenses (toll/misc) full write; maintenance **view costs**; analytics (op cost = fuel+maintenance, efficiency, CSV); static ROI placeholders if shown.
- **Cannot:** trip mutations, driver edits, vehicle writes, masters, users.

## Login

- Role dropdown required on login UI; must match `user.role` (ADR-047).
- Rate limit: 5 failed sign-ins / window (ADR-051).

## API enforcement

1. Mutating endpoints check role server-side.
2. 401 unauthenticated / 403 unauthorized / 429 rate limit.
3. Hide nav for modules with **—**.
