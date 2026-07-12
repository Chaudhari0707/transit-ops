# 06 — Domain Flows

## Flow A — Happy path (PDF example workflow)

1. **Fleet Manager** registers vehicle `Van-05`, max capacity 500 kg, status `available`.
2. **Fleet Manager** registers driver `Alex` with valid license, status `available`.
3. **Dispatcher** creates trip: source region, destination region, vehicle, driver, cargo 450 kg, planned distance. Status `draft`.
4. **Dispatcher** dispatches: system checks 450 ≤ 500, license valid, both available → trip `dispatched`, vehicle+driver `on_trip`, `start_odometer_km` snapshot.
5. **Dispatcher** completes: end odometer, fuel liters, fuel cost → trip `completed`, vehicle odometer updated, both `available`, `fuel_logs` row with `trip_id`.
6. **Fleet Manager** opens maintenance (oil change) → vehicle `in_shop`, hidden from dispatch.
7. **Fleet Manager** closes maintenance → vehicle `available`.
8. **Financial Analyst** sees fuel + maintenance in operational cost / analytics.
9. Dashboard KPIs refresh for all roles (read).

## Flow B — Validation failures

| Attempt                                    | Result                        |
| ------------------------------------------ | ----------------------------- |
| Cargo 600 kg on 500 kg vehicle at dispatch | Reject BR-06                  |
| Assign suspended / expired license driver  | Reject BR-03/04               |
| Assign vehicle `in_shop` or `retired`      | Reject BR-02                  |
| Second dispatched trip same vehicle        | Reject BR-05 (+ unique index) |
| Complete without fuel cost                 | Reject BR-13                  |
| End odometer < start                       | Reject BR-12                  |
| Second open maintenance                    | Reject BR-15                  |

## Flow C — Cancel

- **Draft cancel:** status `cancelled`; vehicle/driver unchanged.
- **Dispatched cancel:** status `cancelled`; vehicle+driver → `available`; no odometer change; no fuel_log.

## Flow D — License compliance

- Safety Officer updates expiry / suspends driver.
- Dispatcher trip form only lists assignable drivers.
- Optional later: job inserts `notification_outbox` rows for expiring licenses (e.g. 30/14/7 days).

## Flow E — Manual fuel & expenses

- Financial Analyst adds fuel log without trip (top-up).
- Financial Analyst adds toll expense linked optionally to trip.
- Maintenance costs **not** entered as expenses.

## Flow F — User bootstrap

1. Seed creates 4 role users.
2. Fleet Manager creates additional users in-app (email, temp password, role).
3. No `admin` role.

## Concurrency notes

- Dispatch and complete must use DB transactions + row locks on vehicle/driver (`SELECT … FOR UPDATE`) to prevent double-dispatch races under concurrent requests.
- Partial unique indexes are the last line of defense.
