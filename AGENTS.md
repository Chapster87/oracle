# Agent Instructions

This file provides context and instructions for AI agents working in this repository.

## Agent skills

### Issue tracker

Issues are tracked on GitHub using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Standard triage labels are used to manage issue lifecycles. See `docs/agents/triage-labels.md`.

### Domain docs

Uses a single-context layout with `CONTEXT.md` and ADRs. See `docs/agents/domain.md`.

### Supabase Access (MCP)

Direct access to the campaign database is provided via the `Oracle-DB` MCP server. This is the **primary** method for agents to interact with live data:

- **Tools**: Use `get_records`, `create_record`, `update_record`, etc., for all CRUD operations on Characters, Locations, Factions, and other entities.
- **Verification**: Use `check_migrations` to ensure the schema is up to date before making changes.
- **Implementation**: The bridge is located at `src/server/mcp/oracle-db.ts` and uses a service-role client to bypass RLS for administrative tasks.

**Project Management Rules:**

- This repository is **sub-issue enabled**.
- Agent actions and Wayfinder sessions MUST heavily utilize GitHub native sub-issue and blocking tags (`--parent`, `--add-sub-issue`, `--add-blocked-by`, `--add-blocking`).
- Sub-issues are the preferred method for task decomposition.
- Always manage the frontier by wiring blocking relationships between tickets.

### Persona

Defines the agent's role as a DM Assistant, tone, and content generation rules. See `docs/agents/persona.md`.

## Coding Standards & Patterns

Follow the component architecture, styling, and folder organization standards in `.rules/`.
