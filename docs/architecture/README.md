# Architecture Docs

Deep design documents for transit-ops domain boundaries. Agents load these on demand — see `.agents/index.md`.

## When to create a doc here

- New domain module with non-obvious invariants
- API contract that spans multiple layers
- Auth/permission model changes
- Database schema with business-rule implications
- Integration with external systems (AVL, CAD, GTFS, etc.)

## Template

Each doc should cover:

1. **Purpose** — what problem this domain solves
2. **Boundaries** — what it owns vs what it delegates
3. **Key invariants** — rules that must never be violated
4. **API surface** — routes, models, error cases
5. **Data model** — tables, relationships, constraints
6. **Testing expectations** — failure modes that must have tests

## Current docs

_None yet — add domain docs as transit-ops structure is designed._
