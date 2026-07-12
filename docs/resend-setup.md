# Resend setup — step by step (developers)

**Goal:** Send test emails from TransitOps using Resend.  
**No domain verification, DNS, webhooks, or verification API needed for testing.**

|              |                                                              |
| ------------ | ------------------------------------------------------------ |
| **Provider** | [resend.com](https://resend.com) only (no nodemailer / SMTP) |
| **Code**     | `src/lib/email/_lib/resend-client.ts`                        |
| **Tickets**  | ODO-40, ODO-51 · ADR-059                                     |

---

## Step 1 — Create a Resend account

1. Open **https://resend.com** in your browser.
2. Click **Sign up** (or **Log in** if you already have an account).
3. Finish signup (email / Google / GitHub — whatever Resend offers).
4. **Write down the email address you used to register.**  
   You will only be able to **receive** test mail at that address until you verify a domain later.

---

## Step 2 — Create an API key on Resend

1. After login, open the Resend **Dashboard**.
2. In the left sidebar, click **API Keys**.
3. Click **Create API Key**.
4. Fill in:
   - **Name:** e.g. `transit-ops-local`
   - **Permission:** **Sending access** (enough for this project)
5. Click **Add** / **Create**.
6. **Copy the key immediately** — it looks like `re_xxxxxxxx...`.  
   You cannot see the full key again later; create a new one if you lose it.
7. Keep it private. Do **not** commit it to git.

You do **not** need to open Domains, Webhooks, Audiences, or Inbound for testing.

---

## Step 3 — Add env vars in this project

1. Open the project root: `transit-ops/`.
2. Open (or create) **`.env.local`** (this file is gitignored).
3. Add these lines (replace the placeholders):

```bash
# --- Resend (testing only) ---
RESEND_API_KEY=re_PASTE_YOUR_KEY_HERE
EMAIL_FROM_ADDRESS=onboarding@resend.dev
EMAIL_FROM_NAME=TransitOps

# Send real email on drain (default is "log" = print to console only)
NOTIFICATIONS_MAIL_MODE=resend

# Must be the SAME email you used to sign up on Resend (testing without domain)
NOTIFICATIONS_FALLBACK_EMAIL=you@your-resend-signup-email.com
```

4. Replace:
   - `re_PASTE_YOUR_KEY_HERE` → your key from Step 2
   - `you@your-resend-signup-email.com` → your Resend signup email from Step 1
5. Save the file.

### Why these exact From / To values?

| Setting  | Value for testing              | Why                                                                        |
| -------- | ------------------------------ | -------------------------------------------------------------------------- |
| **From** | `onboarding@resend.dev`        | Resend’s free sandbox sender. Other From addresses need a verified domain. |
| **To**   | Your Resend account email only | Without a domain, Resend only delivers to the account owner email.         |

---

## Step 4 — Smoke-test Resend (one email)

1. Open a terminal in the project root.
2. Run (use **your** Resend signup email):

```bash
bun run email:test you@your-resend-signup-email.com
```

3. Check the terminal:

| Result                                 | What it means    | What to do                                                                |
| -------------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| Prints **Success** + JSON with an `id` | Key + From work  | Continue to Step 5                                                        |
| `RESEND_API_KEY is not set`            | Env not loaded   | Confirm vars are in `.env.local`, not only `.env.example`                 |
| **401** / unauthorized                 | Bad key          | Recreate API key (Step 2), paste again                                    |
| **403** / not allowed                  | Wrong From or To | From must be `onboarding@resend.dev`; To must be your Resend signup email |

4. Open your email inbox (and spam) for that address.  
   You should see: **TransitOps - Resend connection test**.
5. Optional: in Resend dashboard → **Emails** (or logs) — confirm the message appears.

---

## Step 5 — Test license-expiry notifications (optional)

Only after Step 4 succeeds.

1. Ensure the app DB is up and (if needed) seeded:

```bash
bun run db:status
# if needed: bun run db:seed
```

2. Check notification config:

```bash
bun run notifications:status
```

Confirm mail mode is **resend** and no error about missing `RESEND_API_KEY`.

3. Run enqueue + drain:

```bash
bun run notifications:run
```

4. If a driver is exactly **30 / 14 / 7** days from license expiry (UTC), an email is enqueued and sent to:
   - the driver’s linked `user.email`, if any, or
   - `NOTIFICATIONS_FALLBACK_EMAIL` (your Resend signup email in testing).

5. If nothing is due today, the job may enqueue **0** rows — that is normal.  
   The smoke test in Step 4 is enough to prove Resend works.

---

## Step 6 — Day-to-day local development

| You want…                       | Do this                                                                                            |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| **No real emails** while coding | Set `NOTIFICATIONS_MAIL_MODE=log` in `.env.local` (or remove `resend`). Jobs print to the console. |
| **Real test emails again**      | Set `NOTIFICATIONS_MAIL_MODE=resend` and keep a valid `RESEND_API_KEY`.                            |
| **Re-test connectivity**        | `bun run email:test you@your-resend-signup-email.com`                                              |

---

## Quick checklist

Follow in order:

- [ ] **Step 1** — Resend account created; signup email noted
- [ ] **Step 2** — API key created; `re_...` copied
- [ ] **Step 3** — `.env.local` filled (`RESEND_API_KEY`, From = `onboarding@resend.dev`, mode = `resend`, fallback = signup email)
- [ ] **Step 4** — `bun run email:test <signup-email>` succeeds; mail arrives
- [ ] **Step 5** — (Optional) `bun run notifications:run`
- [ ] **Step 6** — Use `log` mode when you do not need real sends

---

## Production later (skip for testing)

Only when you need a custom From (e.g. `noreply@yourcompany.com`) and arbitrary recipients:

1. Resend dashboard → **Domains** → **Add domain**.
2. Add the DNS records Resend shows (SPF / DKIM).
3. Wait until the domain is **Verified**.
4. Change `.env` / production secrets:

```bash
EMAIL_FROM_ADDRESS=noreply@your-verified-domain.com
EMAIL_FROM_NAME=TransitOps
RESEND_API_KEY=re_...          # prefer a separate production key
NOTIFICATIONS_MAIL_MODE=resend
```

Still no webhooks or verification API required for outbound license-expiry mail.

---

## Related docs

- Env template: [`.env.example`](../.env.example)
- Notification job design: [architecture/10-notifications.md](./architecture/10-notifications.md)
- Code notes: [`src/lib/email/AGENTS.md`](../src/lib/email/AGENTS.md)
