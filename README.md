# Transit Ops

Built on a foundation of _SOVEREIGN ALCHEMY_, this project utilizes [`bun create @gyldlab/next`](https://github.com/gyldlab/next-app) to turn vision into high-performance digital reality.

## Sample login credentials (local / demo)

After `bun run db:seed`, sign in at `/sign-in` with one of the accounts below.

**Shared password for every demo user:** `password`

| Role              | Email                    | Password   | Role dropdown value |
| ----------------- | ------------------------ | ---------- | ------------------- |
| Fleet Manager     | `admin@example.com`      | `password` | Fleet Manager       |
| Financial Analyst | `finance@example.com`    | `password` | Financial Analyst   |
| Safety Officer    | `safety@example.com`     | `password` | Safety Officer      |
| Dispatcher        | `dispatcher@example.com` | `password` | Dispatcher          |

Notes:

- The role dropdown **must** match the user’s real role or sign-in is rejected.
- Defaults come from `AUTH_ADMIN_*` (see `.env.example`). The seed reuses `AUTH_ADMIN_PASSWORD` for all four roles.
- These credentials are for **local development only** — do not use them in production.
