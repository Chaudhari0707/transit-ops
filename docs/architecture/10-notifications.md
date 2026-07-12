# 10 — Notifications (license expiry cron)

**Ticket:** ODO-40 · **ADR:** ADR-059

## Purpose

Daily email reminders when a driver’s `license_expiry_date` is exactly **N** days away (`NOTIFICATIONS_REMINDER_DAYS`, default `30,14,7`).

## Flow

1. **Enqueue** — scan active drivers → insert `notification_outbox` rows (`template_key = driver_license_expiry`)
2. **Drain** — send pending rows via mailer (`log` or `resend`) → mark `sent` / `failed`
3. **Dedupe** — skip if pending/sent already exists for same driver + reminder day + expiry date

## Mail provider (Resend only)

- **No nodemailer, no SMTP.** Sends use the shared Resend HTTP client (`src/lib/email/_lib/resend-client.ts` — dependency-free `fetch` to `https://api.resend.com/emails`).
- Dev/default: `NOTIFICATIONS_MAIL_MODE=log` (stdout, no network).
- Real sends: `NOTIFICATIONS_MAIL_MODE=resend` + `RESEND_API_KEY`.
- **Developer setup (what to click in Resend, test vs domain):** [docs/resend-setup.md](../resend-setup.md).

## Recipients

1. Linked `user.email` when `drivers.user_id` is set
2. Else `NOTIFICATIONS_FALLBACK_EMAIL` (defaults to `AUTH_ADMIN_EMAIL`)

## Ops / schedule (env)

| Variable                      | Default               | Meaning                                                    |
| ----------------------------- | --------------------- | ---------------------------------------------------------- |
| `RESEND_API_KEY`              | —                     | Resend API key (required for `resend` mode)                |
| `EMAIL_FROM_ADDRESS`          | `noreply@example.com` | Shared From address                                        |
| `EMAIL_FROM_NAME`             | `TransitOps`          | Shared From display name                                   |
| `NOTIFICATIONS_ENABLED`       | `true`                | Master switch                                              |
| `NOTIFICATIONS_REMINDER_DAYS` | `30,14,7`             | Exact day thresholds                                       |
| `NOTIFICATIONS_SCHEDULE_TIME` | `09:00`               | UTC `HH:MM` hint for cron/worker                           |
| `NOTIFICATIONS_TIMEZONE`      | `UTC`                 | Documented timezone (schedule compared in UTC)             |
| `NOTIFICATIONS_MAIL_MODE`     | `log`                 | `log` or `resend`                                          |
| `NOTIFICATIONS_FROM_EMAIL`    | (optional)            | From override; else `EMAIL_FROM_NAME <EMAIL_FROM_ADDRESS>` |

### Commands

```bash
bun run notifications:status   # config + outbox counts
bun run notifications:enqueue  # scan → outbox
bun run notifications:drain    # send pending
bun run notifications:run      # enqueue + drain (for OS cron)
bun run notifications:worker   # optional long-running minute watcher
bun run email:test you@x.com   # smoke-test Resend connectivity
```

Example OS cron (near schedule time):

```cron
0 9 * * * cd /path/to/transit-ops && bun run notifications:run
```

## Code layout

- `src/lib/email/_lib/resend-client.ts` — shared Resend HTTP client (no SDK/nodemailer)
- `src/lib/email/resend.ts` — `server-only` re-export for app server code
- `src/modules/notifications/plugins/license-expiry/` — plug-in with manifest + public `server.ts`
- Thin scripts under `scripts/notifications-*.ts` and `scripts/test-email.ts`
