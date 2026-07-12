# Transit Ops

**TransitOps** is a smart transport / fleet operations platform: vehicles, drivers, trips, maintenance, fuel & expenses, analytics, documents, and notifications.

Built on a foundation of _SOVEREIGN ALCHEMY_, this project utilizes [`bun create @gyldlab/next`](https://github.com/gyldlab/next-app) to turn vision into high-performance digital reality.

## Tech stack

End-to-end stack in use across this repository (runtime, data, API, UI, tooling).

### Runtime & language

| Layer                     | Technology                              | Notes                                                  |
| ------------------------- | --------------------------------------- | ------------------------------------------------------ |
| Runtime / package manager | **[Bun](https://bun.sh)**               | Install, scripts, unit tests (`bun test`), script host |
| Language                  | **TypeScript** (strict, `tsc --noEmit`) | App + scripts + Playwright                             |
| Module system             | ES modules (`"type": "module"`)         |                                                        |

### Framework & app shell

| Layer                | Technology                                        | Notes                                                   |
| -------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| Web framework        | **[Next.js](https://nextjs.org) 16** (App Router) | `src/app/**`, Turbopack in dev                          |
| UI library           | **React 19** + **React DOM 19**                   | Server + client components                              |
| React compiler       | **babel-plugin-react-compiler**                   | Next build pipeline                                     |
| Theming              | **next-themes**                                   | Light / dark / system (`ThemeProvider`, class strategy) |
| Server-only boundary | **server-only**                                   | Force server modules not into client bundles            |

### Backend API

| Layer                     | Technology                         | Notes                                                   |
| ------------------------- | ---------------------------------- | ------------------------------------------------------- |
| HTTP API                  | **[Elysia](https://elysiajs.com)** | Domain routes under `src/modules/**`, mounted at `/api` |
| Schema / validation (API) | **Elysia `t` (TypeBox)**           | Request/response models in `model.ts`                   |
| Typed client              | **@elysiajs/eden**                 | End-to-end types from Elysia app                        |
| Effects / scripts         | **Effect**                         | Config, script workflows (seed, admin, email, etc.)     |

### Auth & security

| Layer           | Technology                                     | Notes                                                                        |
| --------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| Authentication  | **[Better Auth](https://www.better-auth.com)** | Email/password sessions                                                      |
| Auth DB adapter | **@better-auth/drizzle-adapter**               | Postgres via Drizzle schema                                                  |
| RBAC            | App roles on `user.role`                       | `fleet_manager`, `dispatcher`, `safety_officer`, `financial_analyst`         |
| Login UX        | Email + password + **role dropdown**           | Server checks selected role matches user; lockout via Better Auth rate limit |

### Database & persistence

| Layer               | Technology                                  | Notes                                               |
| ------------------- | ------------------------------------------- | --------------------------------------------------- |
| Database            | **PostgreSQL**                              | Source of truth for domain + auth tables            |
| ORM                 | **[Drizzle ORM](https://orm.drizzle.team)** | Schema in `src/lib/db/**`                           |
| Migrations / studio | **drizzle-kit**                             | `db:generate`, `db:migrate`, `db:push`, `db:studio` |
| SQL driver          | **postgres** (postgres.js)                  | Connection used by Drizzle                          |
| Seed / ops scripts  | Bun scripts under `scripts/`                | `db:seed`, `db:reset`, `db:verify`, exports, etc.   |

### Frontend UI system

| Layer                     | Technology                                                    | Notes                                                                |
| ------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------- |
| Component system          | **[shadcn/ui](https://ui.shadcn.com)** (`shadcn` CLI package) | Blocks-first UI law — see `docs/architecture/08-ui-shadcn.md`        |
| Primitives                | **@base-ui/react**                                            | Headless base for several shadcn controls                            |
| Styling                   | **Tailwind CSS v4** + **@tailwindcss/postcss**                | Utility CSS in `globals.css`                                         |
| Animation CSS             | **tw-animate-css**                                            | Tailwind animation utilities                                         |
| Class utilities           | **clsx**, **class-variance-authority**, **tailwind-merge**    | Variant + merge helpers (`cn`)                                       |
| Icons                     | **lucide-react**                                              | App icons                                                            |
| Toasts                    | **sonner**                                                    | User-facing notifications                                            |
| Forms                     | **react-hook-form** + **@hookform/resolvers** + **Zod 4**     | Client form schemas                                                  |
| Tables                    | **@tanstack/react-table**                                     | Data tables (vehicles, drivers, etc.)                                |
| Charts                    | **Recharts 3**                                                | Analytics / dashboard visuals                                        |
| Drag & drop               | **@dnd-kit** (core, sortable, modifiers, utilities)           | Sortable UI where needed                                             |
| Popovers / floating UI    | **@floating-ui/dom**                                          | Positioning                                                          |
| Loading skeletons         | **boneyard-js**                                               | Captured bones + structural table/KPI shimmer helpers                |
| Smooth scroll (marketing) | **Lenis** + **GSAP** ticker sync                              | Landing page only (`SmoothScroll`); app shell scrolls content region |

### Email & notifications

| Layer               | Technology                               | Notes                                            |
| ------------------- | ---------------------------------------- | ------------------------------------------------ |
| Transactional email | **Resend** (HTTP API via project client) | No nodemailer/SMTP — see `docs/resend-setup.md`  |
| Outbox / workers    | Bun scripts + domain plugins             | `notifications:*` scripts, license-expiry plugin |

### Testing & quality

| Layer              | Technology                                                        | Notes                         |
| ------------------ | ----------------------------------------------------------------- | ----------------------------- |
| Unit / integration | **Bun test**                                                      | `test/` (`bun run test:unit`) |
| E2E                | **Playwright** (`@playwright/test`)                               | Specs under `playwright/`     |
| Lint               | **oxlint** + custom **lint-rules** (Oxc plugins)                  | Repo gates; no ESLint         |
| Format             | **oxfmt**                                                         | No Prettier                   |
| Git hooks          | **husky** + **lint-staged**                                       | Pre-commit fmt + lint         |
| File size gate     | Custom `scripts/check-file-size.ts`                               | Blocks oversized source files |
| Types              | **typescript**, **@types/bun**, **@types/react**, **@types/node** |                               |

### Architecture conventions (code layout)

| Concern      | Convention                                                                      |
| ------------ | ------------------------------------------------------------------------------- |
| Domain APIs  | Plug-in modules under `src/modules/<domain>/`                                   |
| Pages        | `src/app/<route>/` — `page.tsx` orchestration + `_components/*-page-client.tsx` |
| Shared UI    | `src/components/**` (shadcn + app chrome)                                       |
| Auth helpers | `src/lib/auth/**`                                                               |
| DB           | `src/lib/db/**`                                                                 |
| Docs / ADRs  | `docs/architecture/**`                                                          |
| Agent rules  | `AGENTS.md`, `.agents/**`                                                       |

### At a glance

```
Browser (React 19 + Tailwind 4 + shadcn)
        │
        ▼
Next.js 16 App Router  ──►  Better Auth sessions
        │
        ├── /api/*  →  Elysia modules (TypeBox models, Eden types)
        │                    │
        │                    ▼
        │              Drizzle ORM  →  PostgreSQL
        │
        └── Server components / RSC where appropriate

Tooling: Bun · TypeScript · oxlint · oxfmt · Playwright · husky
Email:   Resend
Motion:  Lenis (landing) · boneyard-js (skeletons) · Recharts (analytics)
```

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
- Changing the role on the sign-in form **autofills** that role’s demo email + password (local convenience only).
- Defaults come from `AUTH_ADMIN_*` (see `.env.example`). The seed reuses `AUTH_ADMIN_PASSWORD` for all four roles.
- These credentials are for **local development only** — do not use them in production.

## Email (Resend) — local testing

Transactional mail uses **Resend** only (no nodemailer).

**Step-by-step:** [docs/resend-setup.md](./docs/resend-setup.md)  
(account → API key → `.env.local` → `bun run email:test` → optional notifications run)

## Further reading

- Architecture (source of truth): [docs/architecture/README.md](./docs/architecture/README.md)
- Testing: [docs/testing.md](./docs/testing.md)
- UI law (shadcn blocks-first): [docs/architecture/08-ui-shadcn.md](./docs/architecture/08-ui-shadcn.md)
- Notifications: [docs/architecture/10-notifications.md](./docs/architecture/10-notifications.md)
