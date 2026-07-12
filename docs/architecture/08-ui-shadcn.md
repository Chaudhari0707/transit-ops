# 08 — UI (shadcn only)

**Tone: mandatory. No custom UI kits.**

## Order (always)

1. **shadcn MCP first** — list/search registry before coding UI
2. **Blocks first** if a block fits (e.g. `login-02`, `dashboard-01`)
3. Else **shadcn components** only (`Button`, `Table`, `Card`, `Form`, …)
4. Never hand-roll primitives that shadcn already ships

## Install

```bash
# MCP → get_add_command_for_items, then:
npx shadcn@latest add <block-or-component>
```

Prefer registry names like `@shadcn/login-02`, `@shadcn/dashboard-01`, `@shadcn/button`.

## Mapping (start here)

| Screen           | Prefer block (if in registry)              | Fallback components                   |
| ---------------- | ------------------------------------------ | ------------------------------------- |
| Login            | `login-02` (or latest login-\*)            | Card, Input, Label, Button, Select    |
| Dashboard / KPIs | `dashboard-01` (or dashboard-\*)           | Card, Chart, Table, Badge             |
| Data tables      | sidebar/dashboard blocks or table patterns | Table, DropdownMenu, Dialog           |
| Forms            | —                                          | Form, Input, Select, Textarea, Button |
| Nav / shell      | dashboard block shell                      | Sidebar, Sheet, Separator             |

Adapt block layout to TransitOps RBAC nav; do not invent alternate design systems.

## Rules

- Strict **shadcn native** only (+ Tailwind utility on those components)
- No MUI / Ant / Chakra / random CSS component libs
- Theme tokens via shadcn/CSS variables
- **Dark mode (ODO-38 / ADR-060):** `ThemeProvider` (`next-themes`) on root layout; Light / Dark / System via header `ThemeToggle` (and optional user menu) — not a Settings module
- One PR: only components you actually use

## Agents / devs

Before any UI ticket: open shadcn MCP → blocks → components.  
If block exists for the screen type → **use block, then customize**.
