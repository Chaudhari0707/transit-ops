# Agent Context Maintenance

## Goal

Keep repository instructions useful for every coding agent without turning startup context into a large, stale manual.

Use this split:

- `AGENTS.md`: concise always-on rules that future agents must follow.
- Scoped `AGENTS.md` files: path-specific rules for app, modules, scripts, components, and lib areas.
- `.agents/*`: detailed standards (API, testing, validation, tooling) loaded on demand via `.agents/index.md`.
- `docs/architecture/*`: deeper explanations for critical design decisions.
- Tests and lint rules: executable enforcement whenever a natural-language rule is important enough to protect.

## When To Update Docs

Update or create an architecture document in the same task when a change affects:

- Database schema or migrations.
- Domain model boundaries.
- API contracts.
- Auth, permissions, or role invariants.
- Cross-layer flows where backend, frontend, scripts, and tests must stay aligned.
- A rule future agents would otherwise need re-explained in prompts.

If the update only changes local implementation details, prefer code comments or tests over new instruction text.

## When To Update AGENTS.md

Update a root or scoped `AGENTS.md` only when the rule should affect future agent behavior.

Good instruction candidates:

- "Database schema changes must update scripts and architecture docs."
- "New APIs require failure-first tests under test/modules."
- "Persisted mutations must validate business invariants server-side."

Poor instruction candidates:

- Long historical explanations.
- One-off migration notes.
- Repeating details already in `docs/architecture/*` or `.agents/*`.
- Preferences that are not enforceable or observable.

## Instruction Hygiene

- Prefer a short rule plus a link to a doc.
- Scope rules to the nearest relevant `AGENTS.md`.
- Remove or rewrite stale rules when architecture changes.
- If a rule can be checked automatically, add or update a test, lint rule, or script.

## Better Auth documentation (MCP)

Before writing or changing authentication code, use the **Better Auth MCP server**:

1. `search_docs` — find the relevant official guide.
2. `get_doc` — read the full page for config and API details.

Do not implement auth features from training data alone. See `.agents/auth.md`.

## Linear ticket sync

When work maps to a Linear issue, keep it in sync via the **Linear MCP server**:

1. `get_issue` / `list_issues` at task start.
2. `save_issue` to in-progress while working (if the team uses that state).
3. `save_issue` to Done + `save_comment` with completion summary **before handoff**.

See `.agents/linear-sync.md` for MCP tool details.

## Critical Change Workflow

For architectural changes:

1. Inspect existing code, docs, tests, scripts, scoped agent instructions, and linked Linear issue.
2. Implement the code change.
3. Update the matching `docs/architecture/*` doc.
4. Update root or scoped `AGENTS.md` with only the durable rule.
5. Update tests, seed data, migrations, and operational scripts that depend on the changed contract.
6. Run focused validation first, then `bun run check`.
7. Update the Linear issue via MCP (state + comment).
8. In the final handoff, mention the docs, instruction files, and Linear issue ID changed.
