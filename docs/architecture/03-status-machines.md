# 03 — Status Machines

All statuses are **Postgres ENUMs**. Transitions happen in **service layer transactions** (DB constraints support, do not replace, business rules).

---

## 3.1 Vehicle status

```
available ──dispatch trip──► on_trip
on_trip ──complete/cancel trip──► available
available ──open maintenance──► in_shop
in_shop ──close maintenance──► available   (unless retired)
* ──retire──► retired                      (terminal for dispatch)
retired ──(no dispatch, no open maintenance)──►
```

| Status      | Dispatch pool | Notes                        |
| ----------- | ------------- | ---------------------------- |
| `available` | Yes           | Default                      |
| `on_trip`   | No            | Exactly one dispatched trip  |
| `in_shop`   | No            | Exactly one open maintenance |
| `retired`   | No            | Terminal operationally       |

**Invariants**

- Never select `retired` or `in_shop` for new trips.
- Opening maintenance requires vehicle not `on_trip` and not already open maintenance (recommend: only from `available`).
- Closing maintenance → `available` if not `retired`.
- Completing/cancelling trip → vehicle `available` only if no concurrent open maintenance (should be impossible if open maintenance blocked while on_trip).

---

## 3.2 Driver status

```
available ──dispatch──► on_trip
on_trip ──complete/cancel──► available
available ──mark off──► off_duty
off_duty ──mark available──► available
* ──suspend──► suspended
suspended ──unsuspend──► available | off_duty
```

| Status      | Assignable to trip?    |
| ----------- | ---------------------- |
| `available` | Yes (if license valid) |
| `on_trip`   | No                     |
| `off_duty`  | No                     |
| `suspended` | No                     |

**License gate (orthogonal to status):**  
`license_expiry_date >= CURRENT_DATE` required for assign/dispatch. Expired license cannot be assigned even if status is `available`.

---

## 3.3 Trip status

```
draft ──dispatch──► dispatched
draft ──cancel──► cancelled
dispatched ──complete──► completed
dispatched ──cancel──► cancelled
completed ──∅──► (terminal)
cancelled ──∅──► (terminal)
```

| From       | To         | Actor      | Side effects                                                                                                                                                                                                                                        |
| ---------- | ---------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| draft      | dispatched | Dispatcher | Validate capacity, license, statuses; set vehicle+driver `on_trip`; snapshot `start_odometer_km`; set `dispatched_at`                                                                                                                               |
| draft      | cancelled  | Dispatcher | No vehicle/driver change (still available)                                                                                                                                                                                                          |
| dispatched | completed  | Dispatcher | Require end odometer + fuel L + cost + **expenses log row(s)**; update vehicle odometer; insert `fuel_logs` + `expenses` + **`revenue_logs`** (planned_km × capacity × rate); vehicle+driver → `available`; trip `completed` (atomic — ADR-053/056) |
| dispatched | cancelled  | Dispatcher | vehicle+driver → `available`; set `cancelled_at` + reason                                                                                                                                                                                           |

**Edit rules**

- `draft`: full edit (vehicle, driver, source/destination locations, cargo, planned distance).
- `dispatched` / `completed` / `cancelled`: core fields immutable; only complete/cancel actions on dispatched.

---

## 3.4 Maintenance status

```
open ──close──► closed
closed ──∅──► terminal
```

| Event       | Vehicle effect                              |
| ----------- | ------------------------------------------- |
| Create open | vehicle → `in_shop` (from `available` only) |
| Close       | vehicle → `available` (if not retired)      |

**Constraint:** ≤1 `open` row per `vehicle_id`.

---

## 3.5 Notification status

```
pending → sent | failed | cancelled
failed → pending (retry)
```

Used by `notification_outbox` worker/scripts (`bun run notifications:drain`).
