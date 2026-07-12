# TransitOps Architecture (Source of Truth)

> **Rule:** Before schema/API/UI data-model work — read this folder.  
> After decision changes — update docs + Linear document in the same change set. **Repo docs win** on conflict.  
> **No machine paths / no host-bound URLs in repo docs.** Relative paths + short names only.

## Self-evolving process

1. Decision first → ADR row in `00-decision-log.md`
2. Keep schema, RBAC, rules, flows consistent
3. Mirror Linear
4. Open items only in `07-open-questions.md`
5. Prefer Excalidraw mockup for UX flow questions

**Last updated:** 2026-07-12 (Revenue ADR-056 + Analytics/Documents modules)  
**Status:** Architecture locked for v1 + trip revenue + reports

**UI mockup:** Excalidraw (TransitOps platform board — project share link)  
**Linear:** project docs — Architecture · Parallel Phases · UI Law (no absolute paths in repo)

## Index

| Doc                                              | Purpose                                         |
| ------------------------------------------------ | ----------------------------------------------- |
| [00-decision-log.md](./00-decision-log.md)       | ADRs (incl. supersessions)                      |
| [01-system-overview.md](./01-system-overview.md) | Scope, modules, out-of-scope                    |
| [02-database-schema.md](./02-database-schema.md) | Tables, FKs, Better Auth, metrics               |
| [03-status-machines.md](./03-status-machines.md) | Status transitions                              |
| [04-business-rules.md](./04-business-rules.md)   | Rules + op cost formula                         |
| [05-rbac-matrix.md](./05-rbac-matrix.md)         | Role access                                     |
| [06-domain-flows.md](./06-domain-flows.md)       | Workflows + trip complete sequence              |
| [07-open-questions.md](./07-open-questions.md)   | Resolved archive (OQ-01 revenue, OQ-08 cron)    |
| [08-ui-shadcn.md](./08-ui-shadcn.md)             | **UI law:** blocks → components; dark mode; MCP |
| [09-vehicles-api.md](./09-vehicles-api.md)       | Vehicles HTTP API + registry UI (ODO-22/23)     |
| [10-notifications.md](./10-notifications.md)     | License-expiry outbox cron (ODO-40)             |
| [../resend-setup.md](../resend-setup.md)         | Resend dashboard + local testing (no domain)    |

## Quick locks (current)

| Topic             | Decision                                                                   |
| ----------------- | -------------------------------------------------------------------------- |
| Op cost           | Fuel + maintenance                                                         |
| Trip ends         | Free-text source/destination (regions ignored)                             |
| Trip complete     | Odometer + fuel_log + **expenses required** + **revenue_log** + free fleet |
| Trip completion % | On-the-fly API/FE calc — **not in DB**                                     |
| Regions           | **Cancelled / ignore**                                                     |
| Settings          | **Out of scope** (static INR, km, revenue rate constant)                   |
| Login             | Email + password + **role dropdown** + 5-fail rate limit                   |
| Trip revenue      | `planned_km × capacity_kg × rate` → `revenue_logs` on complete (ADR-056)   |
| ROI / monthly     | Real from `revenue_logs` + op cost + acquisition cost                      |
| Auth              | Better Auth                                                                |

## Parallel phases & independent merge (for multi-dev)

**Principle:** Work **phase by phase**, and within a phase keep modules **as independent as possible** so developers can merge without stepping on each other.

### Hard gate

| Gate          | Ticket | Why                                      |
| ------------- | ------ | ---------------------------------------- |
| Schema + seed | ODO-19 | Everyone else builds against real tables |
| Auth + RBAC   | ODO-20 | Protected APIs need session + roles      |
| App shell     | ODO-21 | UI mounts under shared layout            |

Frontend may use **mocks** until ODO-20 merges, then wire real auth.

### Parallel streams (after ODO-19)

```
Phase 2 (parallel):
  Stream A: Vehicle API (22) → Vehicle UI (23)
  Stream B: Driver API  (24) → Driver UI  (25)

Phase 3 (after vehicles+drivers APIs):
  Trip API (26) → Trip UI (29)
  [owns atomic complete: odometer + fuel_log + expenses + revenue_log + free fleet]

Phase 4+5 (parallel; after registry; trip complete path owned by 26):
  Stream C: Maintenance API (27) → UI (30)
  Stream D: Fuel/Expense API (28) → UI (31)
  [28 = manual Finance writes + cost GETs; do not re-own trip complete]

Phase 6 (after seed/data exists):
  KPI API (32) ∥ Dashboard UI (33) → Reports (34) → QA (35)

Phase 7 (optional anytime):
  Bonus ODO-36…41
```

### Merge-friendly rules

1. **One ticket ≈ one PR**; merge small and often.
2. **Module folders** — avoid two people editing the same file:  
   `src/modules/{auth,vehicles,drivers,trips,maintenance,fuel,expenses,dashboard,reports}/`
3. **Share only:** `lib/db`, auth session, `requireRole`, UI primitives, shell nav.
4. **No cross-module service imports** — trips read vehicle/driver rows from DB; they do not call vehicle UI code.
5. **Ownership:**
   - Trip complete fuel/expense/**revenue** writes → **ODO-26 / revenue tickets only**
   - Maintenance In Shop status → **ODO-27 only**
   - Auth middleware → **ODO-20 only**
6. **Linear:** see project doc _TransitOps — Parallel Phases & Merge Guide_ for team split.

### Suggested 4-dev split

| Dev  | Focus tickets          |
| ---- | ---------------------- |
| BE-1 | 19 → 20 → 26 → 32      |
| BE-2 | 43 → 22 → 24 → 27 → 28 |
| FE-1 | 21 → 23 → 29 → 33      |
| FE-2 | 25 → 30 → 31 → 34      |

Everyone: ODO-44 (read architecture) first.  
Demo gate: ODO-35 after core merges.

## Gaps closed vs prior docs

- Reversed fuel-only op cost → fuel+maintenance (mockup)
- Dropped regions model for free-text places
- Documented login role dropdown + lockout
- Documented complete sequence odometer→fuel→expenses→available
- Settings screen removed from v1 scope
- Driver trip-completion % not required
- **Phase-by-phase + independent streams for multi-dev merge**
- **Trip revenue model** (`revenue_logs`, ADR-056) — monthly charts + vehicle ROI from real data
