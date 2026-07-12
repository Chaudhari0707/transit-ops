# Source Tree Agent Policy

All work under `src/` follows the layered instruction model:

| Layer      | Policy file                | Scope                             |
| ---------- | -------------------------- | --------------------------------- |
| API routes | `src/app/api/AGENTS.md`    | Elysia mounting                   |
| App / UI   | `src/app/AGENTS.md`        | Pages, layouts, route UI          |
| Modules    | `src/modules/AGENTS.md`    | Backend domain logic              |
| Lib        | `src/lib/AGENTS.md`        | DB, Eden client, shared utilities |
| Components | `src/components/AGENTS.md` | Reusable UI                       |

Load `.agents/index.md` for the full routing table of domain-specific rules.
