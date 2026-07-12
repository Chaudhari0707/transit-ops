# 04 — Mandatory Business Rules

Source: hackathon PDF §4 + Excalidraw mockup + architecture ADRs.

| #     | Rule                                                                                                     | Enforce where                              | DB support                                                                                                     |
| ----- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| BR-01 | Vehicle registration number unique                                                                       | Service + DB unique                        | Unique index on `vehicles.registration_number` (non-deleted)                                                   |
| BR-02 | Retired / In Shop vehicles never in dispatch selection                                                   | Service query filter + dispatch validation | Status enum                                                                                                    |
| BR-03 | Expired license cannot be assigned                                                                       | Dispatch validation                        | `license_expiry_date >= current_date`                                                                          |
| BR-04 | Suspended (or off_duty / on_trip) driver cannot be assigned                                              | Dispatch validation                        | Status checks                                                                                                  |
| BR-05 | Driver or vehicle already On Trip cannot take another trip                                               | Dispatch validation                        | Status + partial unique on dispatched trips                                                                    |
| BR-06 | Cargo weight ≤ vehicle max load capacity                                                                 | Hard fail on dispatch                      |                                                                                                                |
| BR-07 | Dispatch → vehicle & driver status On Trip                                                               | Transaction                                |                                                                                                                |
| BR-08 | Complete → vehicle & driver Available                                                                    | Transaction                                | After odometer + fuel side effects                                                                             |
| BR-09 | Cancel dispatched → vehicle & driver Available                                                           | Transaction                                |                                                                                                                |
| BR-10 | Open maintenance → vehicle In Shop                                                                       | Transaction                                | Partial unique one open maintenance                                                                            |
| BR-11 | Close maintenance → vehicle Available (unless retired)                                                   | Transaction                                |                                                                                                                |
| BR-12 | Odometer only increases on trip complete                                                                 | Complete handler                           | end ≥ start and ≥ current odometer                                                                             |
| BR-13 | Trip complete requires fuel liters + fuel cost                                                           | Complete validation                        | Non-null + fuel_log insert                                                                                     |
| BR-14 | Auto fuel_log on complete with trip_id                                                                   | Complete transaction                       | Optional unique trip_id on fuel_logs                                                                           |
| BR-23 | Trip complete **requires** trip expense logging (toll/misc as applicable) into `expenses` with `trip_id` | Complete transaction                       | At least one expense entry or explicit zero/none policy — product: count expenses here; write `expenses` rows  |
| BR-24 | Trip complete **auto-writes** `revenue_logs` for the trip (1:1)                                          | Complete transaction                       | `amount = planned_km × vehicle.capacity_kg × REVENUE_RATE_INR_PER_KM_KG`; snapshot inputs on log row (ADR-056) |
| BR-15 | At most one open maintenance per vehicle                                                                 | Insert validation                          | Partial unique                                                                                                 |
| BR-16 | Draft editable; dispatched locked                                                                        | Service                                    |                                                                                                                |
| BR-17 | Cancel only from draft or dispatched                                                                     | Service                                    |                                                                                                                |
| BR-18 | Maintenance cost not written as expense rows                                                             | Domain design                              | Op cost still includes maintenance (ADR-044/045)                                                               |
| BR-19 | Soft-deleted rows excluded from selection pools                                                          | Global query convention                    | `deleted_at IS NULL`                                                                                           |
| BR-20 | Only active users can login                                                                              | Auth middleware                            | `is_active` + not deleted                                                                                      |
| BR-21 | Login role dropdown must match `user.role`                                                               | Auth handler                               | ADR-047                                                                                                        |
| BR-22 | After 5 failed sign-in attempts, block further tries in window                                           | Better Auth rate limit                     | ADR-051                                                                                                        |

## Operational cost definition (v1) — ADR-044

Mockup: **TOTAL OPERATIONAL COST (AUTO) = FUEL + MAINTENANCE**

```
vehicle_operational_cost =
    SUM(fuel_logs.cost_inr)
  + SUM(maintenance_logs.cost_inr)
```

- **Included:** fuel + maintenance
- **Not included in auto operational cost:** toll/misc `expenses` (shown separately; mockup “other expenses”)
- **UI link:** other-expenses view may show **MAINT. (LINKED)** as a read-only sum from `maintenance_logs` so Finance sees maintenance next to tolls without double-storing

Fuel efficiency:

```
efficiency_km_per_liter = SUM(trip.actual_distance_km) / SUM(fuel_logs.liters)
```

## Trip revenue & vehicle ROI (ADR-056)

Acting as a transportation company: each completed trip earns revenue from **sold capacity** over **planned distance**.

```
trip_revenue_inr =
    trip.planned_distance_km
  × vehicle.max_load_capacity_kg   -- capacity at complete time (snapshotted)
  × REVENUE_RATE_INR_PER_KM_KG     -- app constant (default 0.05 INR / km / kg)
```

```
monthly_revenue_inr =
    SUM(revenue_logs.amount_inr)
  GROUP BY date_trunc('month', earned_on)
```

```
vehicle_roi_pct =
    ( SUM(revenue_logs.amount_inr for vehicle)
    − vehicle_operational_cost
    ) / vehicle.acquisition_cost_inr × 100
```

- **Written only** on trip complete into `revenue_logs` (unique `trip_id`).
- **Read** by Reports/Analytics (FM + Financial Analyst) for monthly charts and vehicle ROI — same report task as cost metrics.
- Cargo weight is **not** the revenue base; capacity is what the company sells.

## Trip complete sequence (ADR-053 + ADR-056)

See [06-domain-flows.md](./06-domain-flows.md) § Flow H.

**Single atomic transaction** (order of side effects):

1. Validate trip is `dispatched`
2. Validate **end odometer** (≥ start / current)
3. Validate **fuel liters + fuel cost** → insert `fuel_logs` (`trip_id`, `vehicle_id`)
4. Validate **trip expenses** → insert one or more `expenses` rows (`trip_id`, `vehicle_id`, category, amount)
5. Compute **trip revenue** → insert `revenue_logs` (`trip_id`, `vehicle_id`, snapshots + `amount_inr`)
6. Update trip → `completed` (odometer/fuel fields on trip as needed)
7. Update **vehicle** odometer + status `available`
8. Update **driver** status `available`

Vehicle and driver are free for the next trip only after this full sequence succeeds.  
Finance may still add **additional** manual expenses later; **closing the trip** requires expenses to be counted and logged at complete time. Revenue is always auto-computed (no manual entry).

## Transaction boundaries (must be atomic)

1. **Dispatch trip**
2. **Complete trip** (odometer + fuel_log + expenses + revenue_log + status flips)
3. **Cancel dispatched trip**
4. **Open maintenance**
5. **Close maintenance**

Any partial failure → full rollback.
