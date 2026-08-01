# Oracle: TTRPG Campaign Management System

## Purpose

Oracle is a TTRPG (Tabletop Role-Playing Game) campaign management system designed to assist Dungeon Masters (DMs) in organizing, planning, and executing game sessions. It serves as a central repository for world-building, character tracking, story progression, and rules reference.

## Domain Model

### Campaign Management

- **World**: High-level world-building data (`Campaign/World.md`).
- **Episodes**: Recorded sessions and chronological logs (`Campaign/_Episodes/`, `Campaign/_StoryLog.md`).
- **Planning**: Future story arcs and session planning (`Campaign/Planning/`).

### Content Entities

- **Characters**: NPCs and Player Characters (`Campaign/Characters/`, `Campaign/Players/`).
- **Locations**: Geographies, maps, and points of interest (`Campaign/Locations/`).
- **Factions**: Organizations, groups, and power structures (`Campaign/Factions/`).
- **Items**: Magic items, loot, and equipment (`Campaign/Items/`).
- **Religions**: Deities and belief systems (`Campaign/Religions/`).
- **Puzzles & Quest Hooks**: Challenges and plot starters for players (`Campaign/Puzzles/`, `Campaign/Quest Hooks/`).

### Ruleset

- **5e Ruleset**: Reference materials for Dungeons & Dragons 5th Edition (`Rules/5e Ruleset/`).

## Agent Integration

Agents in this repository act as **DM Assistants**, helping to generate content (NPCs, locations, religions) and maintain the story log.

### Agent Skills

- **Chronicle Story**: Updates session logs and world state.
- **Forge Content**: Specialized skills for creating NPCs, Locations, and Religions.
- **Wayfinder**: Used for planning large strokes and spec-ing out project direction.

## Architecture

- **Storage**: Markdown-based file system for maximum portability and AI readability.
- **Structure**: Hierarchical directory structure under `Campaign/` for logical separation of concerns.
- **Rules**: Separation of custom campaign data from core rulesets in `Rules/`.
