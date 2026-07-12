# Linear Ticket Sync (Mandatory via MCP)

Keep Linear in sync with implementation work using the **Linear MCP server** (`linear`). Do not let completed work sit in code without updating the matching ticket.

---

## When to sync

| Event                          | Linear action                                                         |
| ------------------------------ | --------------------------------------------------------------------- |
| Task/issue identified at start | `list_issues` or `get_issue` to confirm scope and acceptance criteria |
| Work in progress               | Update issue state to in-progress equivalent if your team uses it     |
| Task completed                 | `save_issue` → move to **Done** (or team equivalent)                  |
| Task blocked                   | `save_issue` → blocked state + `save_comment` explaining blocker      |
| Scope changes                  | `save_comment` on the issue + update description if durable           |

**Rule:** When a coding task maps to a Linear issue, update that issue **in the same session** before handing off — not as a follow-up.

---

## MCP tools (Linear server)

| Tool                  | Use                                                                   |
| --------------------- | --------------------------------------------------------------------- |
| `list_issues`         | Find issues by query, team, project, assignee (`me`), state           |
| `get_issue`           | Read full issue before starting work                                  |
| `save_issue`          | Create or update issue (`id` for update; `title` + `team` for create) |
| `save_comment`        | Add completion notes, blockers, or PR links                           |
| `list_issue_statuses` | Resolve correct Done / In Progress state names for the team           |
| `list_teams`          | Resolve team name/ID when creating issues                             |

### Updating a completed issue

```text
1. get_issue(id)           — confirm identifier and current state
2. save_issue({
     id: "TRA-123",
     state: "Done",
     description: "... updated acceptance checklist ..."
   })
3. save_comment({
     issueId: "TRA-123",
     body: "Completed: <what shipped>. Gates: lint, typecheck, tests."
   })
```

Use literal markdown in `description` and comment bodies — do not escape newlines.

---

## Workflow integration

Include Linear sync in every multi-step task:

1. **Start** — link the Linear issue in your plan (or ask which issue if unclear).
2. **Implement** — code + tests + docs per other `.agents/*` rules.
3. **Validate** — run relevant gates (`check:fast` minimum).
4. **Sync** — update Linear issue state + completion comment via MCP.
5. **Handoff** — mention the Linear issue ID and final state in the summary.

If no Linear issue exists for non-trivial work, ask whether to create one (`save_issue`) before proceeding.

---

## What to put in completion comments

- What changed (1–3 sentences)
- Files/areas touched (brief)
- Validation run (`check:fast`, `test:unit`, `test:e2e`, etc.)
- Follow-ups or blockers, if any

Keep comments concise. Put durable rules in `AGENTS.md` or `docs/architecture/*`, not only in Linear.
