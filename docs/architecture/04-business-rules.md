# 04 — Mandatory Business Rules

Source: hackathon PDF §4 + product architecture decisions.

| #     | Rule                                                       | Enforce where                                           | DB support                                                           |
| ----- | ---------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------- |
| BR-01 | Vehicle registration number unique                         | Service + DB unique                                     | Unique index on `vehicles.registration_number` (non-deleted)         |
| BR-02 | Retired / In Shop vehicles never in dispatch selection     | Service query filter + dispatch validation              | Status enum + checks                                                 |
| BR-03 | Expired license cannot be assigned                         | Dispatch/create validation                              | `license_expiry_date` compared to current date                       |
| BR-04 | Suspended driver cannot be assigned                        | Dispatch validation                                     | `driver_status != suspended` (and not off_duty/on_trip)              |
| BR-05 | Driver or vehicle already On Trip cannot take another trip | Dispatch validation                                     | Status + partial unique on dispatched trips                          |
| BR-06 | Cargo weight ≤ vehicle max load capacity                   | Dispatch validation (and draft save soft-warn optional) | Hard fail on dispatch                                                |
| BR-07 | Dispatch → vehicle & driver status On Trip                 | Transaction on dispatch                                 | Status enums                                                         |
| BR-08 | Complete → vehicle & driver Available                      | Transaction on complete                                 |                                                                      |
| BR-09 | Cancel dispatched → vehicle & driver Available             | Transaction on cancel                                   |                                                                      |
| BR-10 | Open maintenance → vehicle In Shop                         | Transaction                                             | Partial unique one open maintenance                                  |
| BR-11 | Close maintenance → vehicle Available (unless retired)     | Transaction                                             |                                                                      |
| BR-12 | Odometer only increases on trip complete                   | Complete handler                                        | `end_odometer_km >= start_odometer_km` and `>= vehicles.odometer_km` |
| BR-13 | Trip complete requires fuel liters + fuel cost             | Complete validation                                     | Non-null fields + fuel_log insert                                    |
| BR-14 | Auto fuel_log on complete with trip_id                     | Complete transaction                                    | Optional unique trip_id on fuel_logs                                 |
| BR-15 | At most one open maintenance per vehicle                   | Insert validation                                       | Partial unique index                                                 |
| BR-16 | Draft editable; dispatched locked                          | Service                                                 | Status checks                                                        |
| BR-17 | Cancel only from draft or dispatched                       | Service                                                 |                                                                      |
| BR-18 | Maintenance cost not duplicated in expenses                | Domain design                                           | Separate tables; reporting sums correctly                            |
| BR-19 | Soft-deleted rows excluded from all selection pools        | Global query convention                                 | `deleted_at IS NULL`                                                 |
| BR-20 | Only active users can login                                | Auth service                                            | `is_active` + not deleted                                            |

## Operational cost definition (v1)

```
vehicle_operational_cost =
    SUM(fuel_logs.cost_inr)
  + SUM(maintenance_logs.cost_inr)

-- Optional report toggle:
  + SUM(expenses.amount_inr)
```

Fuel efficiency:

```
efficiency_km_per_liter = SUM(trip.actual_distance_km) / SUM(fuel_logs.liters)
```

(Use trip-linked fuel and completed trips for consistency where possible.)

## Transaction boundaries (must be atomic)

1. **Dispatch trip** — validate + update trip + vehicle + driver
2. **Complete trip** — validate + trip fields + vehicle odometer/status + driver status + insert fuel_log
3. **Cancel dispatched trip** — trip + vehicle + driver
4. **Open maintenance** — log + vehicle status
5. **Close maintenance** — log + vehicle status

Any partial failure → full rollback.
