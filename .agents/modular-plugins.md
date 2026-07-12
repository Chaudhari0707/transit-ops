# Modular Plug-In Architecture (Mandatory for New Features)

Every major feature must ship as an **isolated, plug-in-play module** — a self-contained capability pack wired in without rewriting host code.

---

## 1. What "plug-in-play" means

| Property                | Requirement                                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Single public entry** | External code imports only `plugins/<feature>/index.ts` (client-safe) and `plugins/<feature>/server.ts` (server-only). Never reach into `_lib/` or internal services from host code. |
| **Manifest**            | `plugin-manifest.ts` exports one constant listing route keys, setting keys, env vars, and module `id`.                                                                               |
| **Isolation**           | Business rules, schemas, and persistence for the feature live inside the plug-in folder.                                                                                             |
| **Host wiring is thin** | `page.tsx`, route tables, and API mounts only **register** the plug-in. No duplicated constants.                                                                                     |
| **Failure-first tests** | `test/modules/<domain>/plugins/<feature>/` or `test/modules/<domain>/` mirror the plug-in contract.                                                                                  |

---

## 2. Plug-in folder layout

```text
src/modules/<domain>/plugins/<feature>/
  plugin-manifest.ts   # id, routes, env keys (no server-only imports)
  plugin.ts            # server-only: boot hooks, revalidation
  index.ts             # PUBLIC client-safe exports
  server.ts            # PUBLIC server-only exports
  runtime.ts           # pure rules
  _lib/                # schemas, permissions — private to plug-in
  _types/              # plug-in-owned types
```

---

## 3. Wiring checklist

1. **Manifest** — define `id`, route keys, env keys in `plugin-manifest.ts`
2. **ENV** — document vars via manifest; resolve in plug-in runtime, pass resolved values to client (never read `Bun.env` in client bundles for config)
3. **Consumers** — import from `plugins/<feature>/server.ts` or `index.ts` only
4. **Docs** — update nearest `AGENTS.md`, `docs/architecture/*.md`, and `.agents/index.md` in the same task
5. **Tests** — add failure-first tests under `test/modules/<domain>/`

---

## 4. Anti-patterns (do not ship)

- Hardcoding route paths or config keys in random components
- Importing internal plug-in services from `src/app/**` — use the public barrel
- Copy-pasting config resolution in pages instead of calling a plug-in helper
- Happy-path-only tests with no auth / validation / boundary failures

---

## 5. Adding a new plug-in (template)

1. Create `src/modules/<domain>/plugins/<name>/plugin-manifest.ts`
2. Implement rules in `runtime.ts` or domain service; export through `index.ts` / `server.ts`
3. Add UI under `src/app/<route>/` that only orchestrates
4. Add `test/modules/<domain>/` failure-first tests
5. Document in domain `AGENTS.md` and `docs/architecture/`
