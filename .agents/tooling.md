# Tooling

- For any repo-local package management, dependency installation, script execution, code generation, linting, testing, building, or other workspace command, use **Bun** strictly.
- Do not use node, npm, npx, pnpm, or yarn for repo-local work. External MCP documentation tools are exempt.
- **Formatting:** `bun run fmt` / `bunx oxfmt` — pure Oxc formatter. No Prettier.
- **Linting:** `bun run lint` / `bunx oxlint` — pure Oxc linter. No ESLint.
- Node runtime APIs are banned repo-wide. Do not import Node builtins (`node:fs`, `node:path`, `fs`, `path`) or use `process.env`, `process.cwd`, `process.argv`, or `process.exit`.
- Prefer Bun or Web Platform equivalents: `Bun.env`, `Bun.argv`, `Bun.exit`, `import.meta.dir`, `Bun.file`, `Bun.write`, `Bun.$`, `Bun.spawn`, `URL`.
- This ban applies to `src/`, `scripts/`, `playwright/`, `lint-rules/`, and root config files.
- Custom lint rules in `lint-rules/` are compiled via `bun run build:rules` before every lint run.
