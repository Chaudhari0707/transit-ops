# 06 — Domain Flows

Aligned with Excalidraw mockup screens 0–8.

## Flow A — Happy path (PDF + mockup)

1. **Fleet Manager** registers vehicle `Van-05`, max capacity 500 kg, status `available`.
2. **Fleet Manager** (or Safety) registers driver `Alex` with valid license, status `available`.
3. **Dispatcher** creates trip: source location `Gandhinagar Depot`, destination `Ahmedabad Hub` (from `GET /api/locations`), vehicle + driver from assignable pools (`GET /api/trips/assignables/vehicles`, `GET /api/trips/assignables/drivers`), cargo 450 kg, planned distance. Status `draft`. Source ≠ destination enforced.
4. **Dispatcher** dispatches: system checks 450 ≤ 500, license valid, both available → trip `dispatched`, vehicle+driver `on_trip`, snapshot `start_odometer_km`.
5. **Dispatcher** completes (see Flow H) → odometer + fuel_log + expenses + **revenue_log** → trip `completed`, vehicle+driver Available.
6. **Fleet Manager** opens maintenance (oil change) → vehicle `in_shop`, hidden from dispatch.
7. **Fleet Manager** closes maintenance → vehicle `available`.
8. **Financial Analyst** sees operational cost = **fuel + maintenance**; tolls under other expenses; **trip revenue** on `revenue_logs`.
9. **Reports** show monthly revenue chart + vehicle ROI (revenue − op cost) / acquisition cost.
10. Dashboard KPIs refresh (filters: vehicle type + status only).

## Flow B — Validation failures

| Attempt                                        | Result                     |
| ---------------------------------------------- | -------------------------- |
| Cargo 600 kg on 500 kg vehicle at dispatch     | Reject BR-06               |
| Assign suspended / expired license driver      | Reject BR-03/04            |
| Assign vehicle `in_shop` or `retired`          | Reject BR-02               |
| Second dispatched trip same vehicle            | Reject BR-05               |
| Complete without fuel cost                     | Reject BR-13               |
| Complete without required trip expenses logged | Reject BR-23               |
| End odometer < start                           | Reject BR-12               |
| Second open maintenance                        | Reject BR-15               |
| Login with wrong role selected                 | Reject BR-21               |
| 6th failed password attempt in window          | Rate limit / lockout BR-22 |

## Flow C — Cancel

- **Draft cancel:** status `cancelled`; vehicle/driver unchanged.
- **Dispatched cancel:** status `cancelled`; vehicle+driver → `available`; no odometer/fuel.

## Flow D — License compliance

- FM or Safety full-edit drivers; expired/suspended blocked from trip assign.

## Flow E — Fuel & expenses

- Manual fuel logs (Finance) or auto on trip complete.
- Toll/misc → `expenses`.
- Maintenance costs stay on `maintenance_logs`; UI may show **MAINT. (LINKED)** in other-expenses view.
- **Operational cost auto total = fuel + maintenance** (not tolls).

## Flow F — Login (mockup screen 0)

1. User enters email, password, selects **role** from dropdown.
2. Better Auth validates credentials.
3. App checks selected role === `user.role`.
4. On failure streak ≥ 5 in window → rate limit message (account locked style).
5. Success → session cookie; redirect to dashboard (RBAC nav scoped).

## Flow G — Dashboard KPIs

- Active vehicles = non-retired count.
- Operational cost (analytics) = fuel + maintenance.
- Filters: type + status. **No region filter.**
- **Monthly revenue / vehicle ROI:** real aggregates from `revenue_logs` + op cost (ADR-056) — no static placeholders.

## Flow H — Trip complete sequence (final — ADR-053 + ADR-056)

Mockup: _“On Complete: odometer → fuel log → expenses → Vehicle & Driver Available”_  
**Extended:** auto **revenue_log** after expenses (transport company income for the trip).

All of this happens in **one complete action** (one API transaction). Expenses are **required here** (counted and written to the expenses log table at complete time — not deferred). Revenue is **always auto-computed** (no form fields).

| Step                                   | What happens                                                                                                                                                          | Who        | Data                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------------------- |
| **1. Odometer**                        | Enter **final odometer** (≥ start / current). Set `end_odometer_km`, `actual_distance_km = end − start`. Update `vehicles.odometer_km`.                               | Dispatcher | `trips`, `vehicles`  |
| **2. Fuel log**                        | Enter **liters + fuel cost (INR)**. Insert **`fuel_logs`** with `trip_id` + `vehicle_id` (and mirror fields on trip if useful).                                       | Dispatcher | `fuel_logs`, `trips` |
| **3. Expenses (required on complete)** | Enter trip expenses (toll / misc as applicable). **Insert `expenses` log row(s)** with `trip_id` + `vehicle_id`. Maintenance is still **not** stored as expense rows. | Dispatcher | `expenses`           |
| **4. Revenue log (auto)**              | Compute `planned_km × capacity_kg × rate`. **Insert `revenue_logs`** (unique `trip_id`) with input snapshots + `amount_inr` + `earned_on`.                            | System     | `revenue_logs`       |
| **5. Complete + free resources**       | Trip status → **`completed`**. Vehicle status → **`available`**. Driver status → **`available`**. They can take another trip.                                         | System     | status fields        |

**Atomic rule:** if any of steps 1–5 fails, **rollback all** — no half-completed trip, no orphaned fuel/expense/revenue rows, vehicle/driver stay `on_trip`.

**Why this order:** distance first → fuel for efficiency/op cost → expenses logged against the trip → revenue earned for the trip → only then free fleet for the next round.

### Regions

Ignored for now. **Source and destination = `locations` table FKs** (ADR-055); must differ.

## Product UI flow reference

- Excalidraw mockup (project board / team share — do not commit machine-local paths)

## Concurrency notes

- Dispatch/complete: transactions + `SELECT … FOR UPDATE` on vehicle/driver.
- Partial unique indexes as last line of defense.
