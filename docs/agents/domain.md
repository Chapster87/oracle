# Domain Documentation

This repository uses a **single-context** layout for domain documentation.

## Layout

- **Root Context**: `CONTEXT.md` at the repository root defines the high-level purpose, architecture, and domain model.
- **ADRs**: Architecture Decision Records are stored in `docs/adr/`.

## Consumer Rules

1. **Always read `CONTEXT.md`** at the start of a task to understand the domain and architectural patterns.
2. **Consult `docs/adr/`** when making significant design decisions to ensure alignment with past decisions and project standards.
3. **Keep it current**: Update `CONTEXT.md` when introducing new domain concepts or changing the high-level architecture. Create a new ADR for significant architectural changes.
