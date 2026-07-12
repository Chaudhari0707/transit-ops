# Notifications module

License-expiry email reminders (ODO-40) live under `plugins/license-expiry/`.

- Public barrels: `plugins/license-expiry/index.ts` (client-safe), `plugins/license-expiry/server.ts` (jobs).
- Thin CLI entrypoints: `scripts/notifications-*.ts` → `bun run notifications:*`.
- Schedule time, reminder day thresholds, and mail mode are **env-driven** (see `.env.example` and `plugin-manifest.ts`).
- Drivers without a linked `user.email` fall back to `NOTIFICATIONS_FALLBACK_EMAIL`.
