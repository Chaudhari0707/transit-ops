# Domain Rules — Load When Relevant

| Domain               | File                                          | When to load                                 |
| -------------------- | --------------------------------------------- | -------------------------------------------- |
| **Plug-in modules**  | `.agents/modular-plugins.md`                  | Any new major feature or platform capability |
| **Authentication**   | `.agents/auth.md`                             | Sign-in, sessions, roles, route protection   |
| **Better Auth docs** | Better Auth MCP: `search_docs`, `get_doc`     | Before any auth code change or plugin setup  |
| **Linear sync**      | `.agents/linear-sync.md`                      | Ticket updates via Linear MCP                |
| **Elysia APIs**      | `.agents/api-standards.md`                    | Any new/changed API route or module          |
| **Testing**          | `.agents/testing-standards.md`                | Any new test, API, or business-rule change   |
| Validation / Forms   | `.agents/validation.md`                       | Any form, schema, or server mutation         |
| Tooling / Runtime    | `.agents/tooling.md`                          | Any CLI command, import, or runtime API      |
| Performance          | `.agents/performance.md`                      | Data fetching, caching, query sorting        |
| Images               | `.agents/images.md`                           | Any `next/image` or SVG component            |
| Agent discipline     | `.agents/skills/karpathy-guidelines/SKILL.md` | Non-trivial implementation or refactor       |
| Backend modules      | `src/modules/AGENTS.md`                       | `src/modules/**` work                        |
| API routes           | `src/app/api/AGENTS.md`                       | Elysia route mounting                        |
| App / UI routes      | `src/app/AGENTS.md`                           | Next.js pages, layouts, route UI             |
| Shared components    | `src/components/AGENTS.md`                    | Reusable UI under `src/components/`          |
| DB / client lib      | `src/lib/AGENTS.md`                           | Schema, Eden client, shared lib code         |
| Scripts              | `scripts/AGENTS.md`                           | DB seeds, ops scripts, CLI entrypoints       |
| Architecture docs    | `docs/architecture/*`                         | Deep design for domain boundaries            |
| Testing runbook      | `docs/testing.md`                             | Unit + E2E commands and prerequisites        |
| Context maintenance  | `docs/agent-context-maintenance.md`           | Updating agent docs after arch changes       |
| E2E browser tests    | `playwright/`                                 | Playwright specs for critical UI flows       |

## Skills (load before implementation)

| Skill                 | Path                                                    | When                              |
| --------------------- | ------------------------------------------------------- | --------------------------------- |
| ElysiaJS              | `.agents/skills/elysiajs/SKILL.md`                      | Backend modules, API routes, Eden |
| React best practices  | `.agents/skills/vercel-react-best-practices/SKILL.md`   | React/Next.js performance         |
| Composition patterns  | `.agents/skills/vercel-composition-patterns/SKILL.md`   | Component architecture            |
| View transitions      | `.agents/skills/vercel-react-view-transitions/SKILL.md` | Page/state animations             |
| Web design guidelines | `.agents/skills/web-design-guidelines/SKILL.md`         | UI review, accessibility audit    |
