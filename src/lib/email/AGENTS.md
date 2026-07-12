# Email (Resend)

Shared transactional email via **Resend HTTP API**.

- **No nodemailer, no SMTP, no Resend SDK** — single `fetch` to `https://api.resend.com/emails`.
- Implementation: `_lib/resend-client.ts` (pure). Server boundary: `resend.ts` (`server-only`).
- Env: `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`.
- License-expiry jobs use the client when `NOTIFICATIONS_MAIL_MODE=resend` (see `src/modules/notifications/`).
- Types live in `_types/`; do not re-export types from runtime modules.
- Unit tests import `_lib/resend-client` (not `resend.ts`) to avoid `server-only` in bun test.
- **Developer setup (Resend dashboard + local testing):** [docs/resend-setup.md](../../../docs/resend-setup.md).
