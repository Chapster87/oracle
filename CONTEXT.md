# Oracle: TTRPG Campaign Management System

## Purpose

Oracle is a TTRPG (Tabletop Role-Playing Game) campaign management system designed to assist Dungeon Masters (DMs) in organizing, planning, and executing game sessions. It serves as a central repository for world-building, character tracking, story progression, and rules reference.

## Domain Model

### Campaign Management

- **World**: High-level world-building data (`Campaign/World.md`).
- **Episodes**: Recorded sessions and chronological logs (`Campaign/_Episodes/`, `Campaign/_StoryLog.md`).
- **Planning**: Future story arcs and session planning (`Campaign/Planning/`).
- **Story Arc**: A planning document that bridges sessions into a narrative and references the resources it manifests. A first-class entity with a status (`planned`, `active`, `completed`) and a `needed_resources` list.

### Content Entities

- **Characters**: NPCs and Player Characters (`Campaign/Characters/`, `Campaign/Players/`).
- **Locations**: Geographies, maps, and points of interest (`Campaign/Locations/`).
- **Factions**: Organizations, groups, and power structures (`Campaign/Factions/`).
- **Items**: Magic items, loot, and equipment (`Campaign/Items/`).
- **Religions**: Deities and belief systems (`Campaign/Religions/`).
- **Puzzles & Quest Hooks**: Challenges and plot starters for players (`Campaign/Puzzles/`, `Campaign/Quest Hooks/`).
- **Metadata**: Auxiliary key/value data attached to an entity — for example a D&D Beyond sheet URL. Not a free-form field store: only keys the app recognises are editable, and DM-only keys are filtered out of player payloads.

### Ruleset

- **5e Ruleset**: Reference materials for Dungeons & Dragons 5th Edition (`Rules/5e Ruleset/`).

## Agent Integration

Agents in this repository act as **DM Assistants**, helping to generate content (NPCs, locations, religions) and maintain the story log.

### Agent Skills

- **Chronicle Story**: Updates session logs and world state.
- **Forge Content**: Specialized skills for creating NPCs, Locations, and Religions.
- **Wayfinder**: Used for planning large strokes and spec-ing out project direction.

### Lanes

A **lane** is a named capability scope for the in-app chat agent. A lane binds one or more repo skills to a fixed set of proposal capabilities, so selecting a lane both loads its rules and limits what it may propose. Lanes are declared in code and selected per message; the editor agent is not lane-scoped.

### Drafts

- **Draft**: A proposed entity change staged for DM review. A draft is never player-visible and reaches the live entity tables only through explicit promotion.
- **Draft fork**: A sibling draft created when the agent re-proposes a draft the DM has already edited. The DM's draft stays pending; the agent's proposal is linked by `supersedes_id`, and promoting one supersedes the others.

## Architecture

- **Storage**: Markdown-based file system for maximum portability and AI readability.
- **Structure**: Hierarchical directory structure under `Campaign/` for logical separation of concerns.
- **Rules**: Separation of custom campaign data from core rulesets in `Rules/`.
