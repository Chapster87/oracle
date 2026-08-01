# Agent Instructions

This file provides context and instructions for AI agents working in this repository.

## Agent skills

### Issue tracker

Issues are tracked on GitHub using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Standard triage labels are used to manage issue lifecycles. See `docs/agents/triage-labels.md`.

### Domain docs

Uses a single-context layout with `CONTEXT.md` and ADRs. See `docs/agents/domain.md`.

**Project Management Rules:**

- This repository is **sub-issue enabled**.
- Agent actions and Wayfinder sessions MUST heavily utilize GitHub native sub-issue and blocking tags (`--parent`, `--add-sub-issue`, `--add-blocked-by`, `--add-blocking`).
- Sub-issues are the preferred method for task decomposition.
- Always manage the frontier by wiring blocking relationships between tickets.

### Persona

Defines the agent's role as a DM Assistant, tone, and content generation rules. See `docs/agents/persona.md`.

## Coding Standards & Patterns

To maintain a consistent and scalable codebase, agents must follow these rules:

- **Component Architecture**: Follow the modular patterns in `docs/agents/rules/agent-rules.md`.
- **Styling**: Adhere to the CSS Modules and 8px grid system in `docs/agents/rules/component-styling.md`.
- **Organization**: Group feature files according to the local-first structure in `docs/agents/rules/folder-organization.md`.
