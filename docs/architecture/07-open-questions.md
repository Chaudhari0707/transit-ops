# 07 — Open Questions / Deferred

Items **not blocked** for schema v1, but must not be invented silently in code.

| ID    | Topic                                               | Status       | Notes                                                                                                                                             |
| ----- | --------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| OQ-01 | Vehicle ROI revenue source                          | **Deferred** | PDF formula needs Revenue; product said “later”. Do not add fake revenue columns until decided. Analytics can ship cost + efficiency without ROI. |
| OQ-02 | Exact “Active Vehicles” KPI definition              | Soft         | Recommend: non-retired count vs on_trip-only; confirm when building dashboard labels.                                                             |
| OQ-03 | Session storage (JWT vs DB sessions)                | Soft         | Auth implementation detail; not domain schema critical.                                                                                           |
| OQ-04 | Expenses in “operational cost” default              | Soft         | Core = fuel + maintenance; expenses as optional toggle in reports.                                                                                |
| OQ-05 | Fleet Manager vs Safety split on driver fields      | Soft         | Documented preference in RBAC; refine if product wants FM full driver edit.                                                                       |
| OQ-06 | Trip region filter: source, destination, or either? | Soft         | Dashboard “region” filter — default: match if source **or** destination equals selected region.                                                   |
| OQ-07 | File upload max size / allowed mime types           | Soft         | Implement with sane defaults (e.g. 5MB; pdf/jpg/png).                                                                                             |
| OQ-08 | Notification cron schedule                          | Soft         | Outbox table ready; worker timing later.                                                                                                          |

## Resolved recently (do not re-open without ADR)

- RBAC mockup matrix (not FM superuser) — ADR-029
- Maintenance ownership FM write / Finance view — ADR-030
- Regions-only trip endpoints — ADR-014
- Single org — ADR-001
