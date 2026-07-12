# 07 — Open Questions / Deferred

## Still open / later tasks

| ID    | Topic                      | Status         | Notes                                                                                                                                    |
| ----- | -------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| OQ-01 | Real revenue for ROI       | **Later task** | Analytics may show **static** ROI % / monthly revenue for demo (ADR-050). Do not invent revenue DB columns until product defines source. |
| OQ-08 | Notification cron / worker | **Later task** | `notification_outbox` table remains; schedule/worker not v1.                                                                             |

## Resolved archive

| ID                     | Resolution                                                         | ADR     |
| ---------------------- | ------------------------------------------------------------------ | ------- |
| OQ-02 Active vehicles  | Non-retired count                                                  | ADR-035 |
| OQ-03 Auth/sessions    | Better Auth + DB session                                           | ADR-036 |
| OQ-04 Operational cost | **Superseded:** now **fuel + maintenance** (was briefly fuel-only) | ADR-044 |
| OQ-05 Driver edit      | FM + Safety full edit                                              | ADR-038 |
| OQ-06 Region filter    | **Regions cancelled entirely** — free-text trip ends, no filter    | ADR-043 |
| OQ-07 Uploads          | ENV max size + MIME; default 5MB / all types                       | ADR-040 |

## Excalidraw-driven locks (2026-07-12 pass)

| Topic                    | Lock                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| Trip source/destination  | Free text                                                                                             |
| Regions                  | Removed                                                                                               |
| Settings module          | Out of scope; static INR + km                                                                         |
| Driver trip completion % | **Not in DB** — compute on the fly (API and/or frontend) after trips data loads                       |
| Login role dropdown      | Required + server match                                                                               |
| 5 failed logins          | Better Auth rate limit                                                                                |
| Op cost                  | Fuel + maintenance                                                                                    |
| Other expenses           | Toll/misc + **linked** maintenance display                                                            |
| Complete flow            | **Atomic:** odometer → fuel_log → **expenses (required)** → trip completed → vehicle+driver Available |

## Visual flow reference

Excalidraw mockup (project share). No machine-local paths in repo.
