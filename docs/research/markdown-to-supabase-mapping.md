# Research: Markdown-to-Supabase Schema Mapping

## Overview

This research defines how existing campaign Markdown files (Characters, Locations, Factions, etc.) map to a unified Supabase schema. It follows the 'Second Brain' multi-tenancy model where `campaign_id` separates silos while allowing a 'Global' knowledge base.

## Core Schema Strategy

### 1. Multi-Tenancy

Every table (except global rules/reference) includes:

- `id`: UUID (Primary Key)
- `campaign_id`: UUID (Foreign Key to `campaigns` table, NULL for Global Knowledge)
- `created_at`: timestamptz
- `updated_at`: timestamptz

### 2. Entity Tables

#### Characters (`characters`)

Mapped from `Campaign/Characters/*.md`

- `name`: string (from `# [Name]`)
- `species`: string (parsed from `Race, Class, & Alignment`. **Note**: Existing files use "Race", but "Species" is used for the database schema and app nomenclature)
- `class`: string (parsed from `Race, Class, & Alignment`)
- `alignment`: string (parsed from `Race, Class, & Alignment`)
- `tags`: text[] (e.g., `['npc', 'merchant']`)
- `appearance`: text (from `## Appearance`)
- `personality`: text (from `## Personality`)
- `role`: text (from `## Role in Campaign`)
- `secrets`: text (from `<!-- ## Secrets -->`)
- `is_deceased`: boolean (inferred from `#deceased` tag)
- `metadata`: jsonb (for any non-standard fields)

#### Locations (`locations`)

Mapped from `Campaign/Locations/**/*.md`

- `name`: string
- `type`: string (e.g., 'Settlement', 'Dungeon', 'Region')
- `sub_type`: string (e.g., 'City', 'Village')
- `region_id`: uuid (FK to self, for nesting)
- `tags`: text[]
- `overview`: text
- `history`: text
- `inhabitants`: text
- `points_of_interest`: jsonb (Array of `{ name, description }`)
- `rumors_lore`: text[]
- `map_data`: text (ASCII or image URL)

#### Factions (`factions`)

Mapped from `Campaign/Factions/*.md`

- `name`: string
- `alignment`: string
- `tags`: text[]
- `overview`: text
- `goals`: text
- `beliefs`: text

### 3. Relations (Join Tables)

- `entity_relations`: `(source_id, target_id, relation_type)`
  - Used for `Associated Locations`, `Associated Factions`, `Key NPCs`.
- `campaign_appearances`: `(entity_id, episode_id)`

## Migration Logic (Layered Upsert)

1. **Global Pass**: Import from `main` branch into `campaign_id = NULL`.
2. **Campaign Pass**: Iterate through campaign branches (e.g., `campaigns/zero`).
   - Create Campaign record to get `campaign_id`.
   - Upsert records. If a record exists in Global with same name, copy/branch it into the campaign silo unless explicitly marked as a "Global Reference".

## Frontmatter/Structure Extraction Regex

- **Title**: `^#\s+(.*)`
- **Attributes**: `^-\s+\*\*([^:]+):\*\*\s+(.*)`
- **Sections**: `^##\s+([^\n]+)\n\n([\s\S]*?)(?=\n##|$)`
